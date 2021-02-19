"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
function bufferToStream(buf) {
    return new stream_1.Readable({
        read() {
            this.push(buf);
            this.push(null);
        },
    });
}
exports.default = bufferToStream;
//# sourceMappingURL=bufferToStream.js.map