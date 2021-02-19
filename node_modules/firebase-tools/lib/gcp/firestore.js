"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocuments = exports.deleteDocument = exports.listCollectionIds = void 0;
const api_1 = require("../api");
const apiv2 = require("../apiv2");
const _CLIENT = new apiv2.Client({
    auth: true,
    apiVersion: "v1",
    urlPrefix: api_1.firestoreOriginOrEmulator,
});
function listCollectionIds(project) {
    const url = "projects/" + project + "/databases/(default)/documents:listCollectionIds";
    const data = {
        pageSize: 2147483647,
    };
    return _CLIENT.post(url, data).then((res) => {
        return res.body.collectionIds || [];
    });
}
exports.listCollectionIds = listCollectionIds;
async function deleteDocument(doc) {
    return _CLIENT.delete(doc.name);
}
exports.deleteDocument = deleteDocument;
async function deleteDocuments(project, docs) {
    const url = "projects/" + project + "/databases/(default)/documents:commit";
    const writes = docs.map((doc) => {
        return { delete: doc.name };
    });
    const data = { writes };
    const res = await _CLIENT.post(url, data);
    return res.body.writeResults.length;
}
exports.deleteDocuments = deleteDocuments;
