"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreDelete = void 0;
const clc = require("cli-color");
const ProgressBar = require("progress");
const apiv2 = require("../apiv2");
const firestore = require("../gcp/firestore");
const error_1 = require("../error");
const logger = require("../logger");
const utils = require("../utils");
const api_1 = require("../api");
const MIN_ID = "__id-9223372036854775808__";
class FirestoreDelete {
    constructor(project, path, options) {
        this.project = project;
        this.path = path || "";
        this.recursive = Boolean(options.recursive);
        this.shallow = Boolean(options.shallow);
        this.allCollections = Boolean(options.allCollections);
        this.readBatchSize = 7500;
        this.maxPendingDeletes = 15;
        this.deleteBatchSize = 250;
        this.maxQueueSize = this.deleteBatchSize * this.maxPendingDeletes * 2;
        this.path = this.path.replace(/(^\/+|\/+$)/g, "");
        this.allDescendants = this.recursive;
        this.root = "projects/" + project + "/databases/(default)/documents";
        const segments = this.path.split("/");
        this.isDocumentPath = segments.length % 2 === 0;
        this.isCollectionPath = !this.isDocumentPath;
        this.parent = this.root;
        if (this.isCollectionPath) {
            segments.pop();
        }
        if (segments.length > 0) {
            this.parent += "/" + segments.join("/");
        }
        if (!options.allCollections) {
            this.validateOptions();
        }
        this.apiClient = new apiv2.Client({
            auth: true,
            apiVersion: "v1",
            urlPrefix: api_1.firestoreOriginOrEmulator,
        });
    }
    setDeleteBatchSize(size) {
        this.deleteBatchSize = size;
        this.maxQueueSize = this.deleteBatchSize * this.maxPendingDeletes * 2;
    }
    validateOptions() {
        if (this.recursive && this.shallow) {
            throw new error_1.FirebaseError("Cannot pass recursive and shallow options together.");
        }
        if (this.isCollectionPath && !this.recursive && !this.shallow) {
            throw new error_1.FirebaseError("Must pass recursive or shallow option when deleting a collection.");
        }
        const pieces = this.path.split("/");
        if (pieces.length === 0) {
            throw new error_1.FirebaseError("Path length must be greater than zero.");
        }
        const hasEmptySegment = pieces.some((piece) => {
            return piece.length === 0;
        });
        if (hasEmptySegment) {
            throw new error_1.FirebaseError("Path must not have any empty segments.");
        }
    }
    collectionDescendantsQuery(allDescendants, batchSize, startAfter) {
        const nullChar = String.fromCharCode(0);
        const startAt = this.root + "/" + this.path + "/" + MIN_ID;
        const endAt = this.root + "/" + this.path + nullChar + "/" + MIN_ID;
        const where = {
            compositeFilter: {
                op: "AND",
                filters: [
                    {
                        fieldFilter: {
                            field: {
                                fieldPath: "__name__",
                            },
                            op: "GREATER_THAN_OR_EQUAL",
                            value: {
                                referenceValue: startAt,
                            },
                        },
                    },
                    {
                        fieldFilter: {
                            field: {
                                fieldPath: "__name__",
                            },
                            op: "LESS_THAN",
                            value: {
                                referenceValue: endAt,
                            },
                        },
                    },
                ],
            },
        };
        const query = {
            structuredQuery: {
                where: where,
                limit: batchSize,
                from: [
                    {
                        allDescendants: allDescendants,
                    },
                ],
                select: {
                    fields: [{ fieldPath: "__name__" }],
                },
                orderBy: [{ field: { fieldPath: "__name__" } }],
            },
        };
        if (startAfter) {
            query.structuredQuery.startAt = {
                values: [{ referenceValue: startAfter }],
                before: false,
            };
        }
        return query;
    }
    docDescendantsQuery(allDescendants, batchSize, startAfter) {
        const query = {
            structuredQuery: {
                limit: batchSize,
                from: [
                    {
                        allDescendants: allDescendants,
                    },
                ],
                select: {
                    fields: [{ fieldPath: "__name__" }],
                },
                orderBy: [{ field: { fieldPath: "__name__" } }],
            },
        };
        if (startAfter) {
            query.structuredQuery.startAt = {
                values: [{ referenceValue: startAfter }],
                before: false,
            };
        }
        return query;
    }
    getDescendantBatch(allDescendants, batchSize, startAfter) {
        const url = this.parent + ":runQuery";
        const body = this.isDocumentPath
            ? this.docDescendantsQuery(allDescendants, batchSize, startAfter)
            : this.collectionDescendantsQuery(allDescendants, batchSize, startAfter);
        return this.apiClient.post(url, body).then((res) => {
            return res.body
                .filter((x) => {
                return x.document;
            })
                .map((x) => {
                return x.document;
            });
        });
    }
    recursiveBatchDelete() {
        let queue = [];
        let numDocsDeleted = 0;
        let numPendingDeletes = 0;
        let pagesRemaining = true;
        let pageIncoming = false;
        let lastDocName = undefined;
        const retried = {};
        let failures = [];
        let fetchFailures = 0;
        const queueLoop = () => {
            if (queue.length === 0 && numPendingDeletes === 0 && !pagesRemaining) {
                return true;
            }
            if (failures.length > 0) {
                logger.debug("Found " + failures.length + " failed operations, failing.");
                return true;
            }
            if (queue.length <= this.maxQueueSize && pagesRemaining && !pageIncoming) {
                pageIncoming = true;
                this.getDescendantBatch(this.allDescendants, this.readBatchSize, lastDocName)
                    .then((docs) => {
                    fetchFailures = 0;
                    pageIncoming = false;
                    if (docs.length === 0) {
                        pagesRemaining = false;
                        return;
                    }
                    queue = queue.concat(docs);
                    lastDocName = docs[docs.length - 1].name;
                })
                    .catch((e) => {
                    logger.debug("Failed to fetch page after " + lastDocName, e);
                    pageIncoming = false;
                    fetchFailures++;
                    if (fetchFailures === 3) {
                        failures.push(e);
                    }
                });
            }
            if (numDocsDeleted === 0 && numPendingDeletes >= 1) {
                return false;
            }
            if (numPendingDeletes > this.maxPendingDeletes) {
                return false;
            }
            if (queue.length === 0) {
                return false;
            }
            const toDelete = [];
            const numToDelete = Math.min(this.deleteBatchSize, queue.length);
            for (let i = 0; i < numToDelete; i++) {
                toDelete.push(queue.shift());
            }
            numPendingDeletes++;
            firestore
                .deleteDocuments(this.project, toDelete)
                .then((numDeleted) => {
                FirestoreDelete.progressBar.tick(numDeleted);
                numDocsDeleted += numDeleted;
                numPendingDeletes--;
            })
                .catch((e) => {
                if (e.status === 400 &&
                    e.message.includes("Transaction too big") &&
                    this.deleteBatchSize >= 2) {
                    logger.debug("Transaction too big error deleting doc batch", e);
                    const newBatchSize = Math.floor(toDelete.length / 10);
                    if (newBatchSize < this.deleteBatchSize) {
                        utils.logLabeledWarning("firestore", `delete transaction too large, reducing batch size from ${this.deleteBatchSize} to ${newBatchSize}`);
                        this.setDeleteBatchSize(newBatchSize);
                    }
                    queue.unshift(...toDelete);
                }
                else if (e.status >= 500 && e.status < 600) {
                    logger.debug("Server error deleting doc batch", e);
                    toDelete.forEach((doc) => {
                        if (retried[doc.name]) {
                            logger.debug("Failed to delete doc " + doc.name + " multiple times.");
                            failures.push(doc.name);
                        }
                        else {
                            retried[doc.name] = true;
                            queue.push(doc);
                        }
                    });
                }
                else {
                    logger.debug("Fatal error deleting docs ", e);
                    failures = failures.concat(toDelete);
                }
                numPendingDeletes--;
            });
            return false;
        };
        return new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
                if (queueLoop()) {
                    clearInterval(intervalId);
                    if (failures.length === 0) {
                        resolve();
                    }
                    else {
                        const docIds = failures.map((d) => d.name).join(", ");
                        reject(new error_1.FirebaseError("Failed to delete documents " + docIds, { exit: 1 }));
                    }
                }
            }, 0);
        });
    }
    deletePath() {
        let initialDelete;
        if (this.isDocumentPath) {
            const doc = { name: this.root + "/" + this.path };
            initialDelete = firestore.deleteDocument(doc).catch((err) => {
                logger.debug("deletePath:initialDelete:error", err);
                if (this.allDescendants) {
                    return Promise.resolve();
                }
                return utils.reject("Unable to delete " + clc.cyan(this.path));
            });
        }
        else {
            initialDelete = Promise.resolve();
        }
        return initialDelete.then(() => {
            return this.recursiveBatchDelete();
        });
    }
    deleteDatabase() {
        return firestore
            .listCollectionIds(this.project)
            .catch((err) => {
            logger.debug("deleteDatabase:listCollectionIds:error", err);
            return utils.reject("Unable to list collection IDs");
        })
            .then((collectionIds) => {
            const promises = [];
            logger.info("Deleting the following collections: " + clc.cyan(collectionIds.join(", ")));
            for (let i = 0; i < collectionIds.length; i++) {
                const collectionId = collectionIds[i];
                const deleteOp = new FirestoreDelete(this.project, collectionId, {
                    recursive: true,
                });
                promises.push(deleteOp.execute());
            }
            return Promise.all(promises);
        });
    }
    checkHasChildren() {
        return this.getDescendantBatch(true, 1).then((docs) => {
            return docs.length > 0;
        });
    }
    execute() {
        let verifyRecurseSafe;
        if (this.isDocumentPath && !this.recursive && !this.shallow) {
            verifyRecurseSafe = this.checkHasChildren().then((multiple) => {
                if (multiple) {
                    return utils.reject("Document has children, must specify -r or --shallow.", { exit: 1 });
                }
            });
        }
        else {
            verifyRecurseSafe = Promise.resolve();
        }
        return verifyRecurseSafe.then(() => {
            return this.deletePath();
        });
    }
}
exports.FirestoreDelete = FirestoreDelete;
FirestoreDelete.progressBar = new ProgressBar("Deleted :current docs (:rate docs/s)\n", {
    total: Number.MAX_SAFE_INTEGER,
});
