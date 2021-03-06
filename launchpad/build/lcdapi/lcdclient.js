"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LcdClient = exports.normalizeLcdApiArray = void 0;
/* eslint-disable no-dupe-class-members, @typescript-eslint/ban-types, @typescript-eslint/naming-convention */
const utils_1 = require("@cosmjs/utils");
const axios_1 = __importDefault(require("axios"));
const base_1 = require("./base");
function normalizeLcdApiArray(backend) {
    return backend || [];
}
exports.normalizeLcdApiArray = normalizeLcdApiArray;
// We want to get message data from 500 errors
// https://stackoverflow.com/questions/56577124/how-to-handle-500-error-message-with-axios
// this should be chained to catch one error and throw a more informative one
function parseAxiosError(err) {
    var _a;
    // use the error message sent from server, not default 500 msg
    if ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) {
        let errorText;
        const data = err.response.data;
        // expect { error: string }, but otherwise dump
        if (data.error && typeof data.error === "string") {
            errorText = data.error;
        }
        else if (typeof data === "string") {
            errorText = data;
        }
        else {
            errorText = JSON.stringify(data);
        }
        throw new Error(`${errorText} (HTTP ${err.response.status})`);
    }
    else {
        throw err;
    }
}
/**
 * A client to the LCD's (light client daemon) API.
 * This light client connects to Tendermint (i.e. the chain), encodes/decodes Amino data for us and provides a convenient JSON interface.
 *
 * This _JSON over HTTP_ API is sometimes referred to as "REST" or "RPC", which are both misleading terms
 * for the same thing.
 *
 * Please note that the client to the LCD can not verify light client proofs. When using this,
 * you need to trust the API provider as well as the network connection between client and API.
 *
 * @see https://cosmos.network/rpc
 */
class LcdClient {
    /**
     * Creates a new client to interact with a Cosmos SDK light client daemon.
     * This class tries to be a direct mapping onto the API. Some basic decoding and normalizatin is done
     * but things like caching are done at a higher level.
     *
     * When building apps, you should not need to use this class directly. If you do, this indicates a missing feature
     * in higher level components. Feel free to raise an issue in this case.
     *
     * @param apiUrl The URL of a Cosmos SDK light client daemon API (sometimes called REST server or REST API)
     * @param broadcastMode Defines at which point of the transaction processing the broadcastTx method returns
     */
    constructor(apiUrl, broadcastMode = base_1.BroadcastMode.Block) {
        const headers = {
            post: { "Content-Type": "application/json" },
        };
        this.client = axios_1.default.create({
            baseURL: apiUrl,
            headers: headers,
        });
        this.broadcastMode = broadcastMode;
    }
    static withExtensions(options, ...extensionSetups) {
        const client = new LcdClient(options.apiUrl, options.broadcastMode);
        const extensions = extensionSetups.map((setupExtension) => setupExtension(client));
        for (const extension of extensions) {
            utils_1.assert(utils_1.isNonNullObject(extension), `Extension must be a non-null object`);
            for (const [moduleKey, moduleValue] of Object.entries(extension)) {
                utils_1.assert(utils_1.isNonNullObject(moduleValue), `Module must be a non-null object. Found type ${typeof moduleValue} for module "${moduleKey}".`);
                const current = client[moduleKey] || {};
                client[moduleKey] = Object.assign(Object.assign({}, current), moduleValue);
            }
        }
        return client;
    }
    async get(path, params) {
        const { data } = await this.client.get(path, { params }).catch(parseAxiosError);
        if (data === null) {
            throw new Error("Received null response from server");
        }
        return data;
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async post(path, params) {
        if (!utils_1.isNonNullObject(params))
            throw new Error("Got unexpected type of params. Expected object.");
        const { data } = await this.client.post(path, params).catch(parseAxiosError);
        if (data === null) {
            throw new Error("Received null response from server");
        }
        return data;
    }
    // The /blocks endpoints
    async blocksLatest() {
        const responseData = await this.get("/blocks/latest");
        if (!responseData.block) {
            throw new Error("Unexpected response data format");
        }
        return responseData;
    }
    async blocks(height) {
        const responseData = await this.get(`/blocks/${height}`);
        if (!responseData.block) {
            throw new Error("Unexpected response data format");
        }
        return responseData;
    }
    // The /node_info endpoint
    async nodeInfo() {
        const responseData = await this.get("/node_info");
        if (!responseData.node_info) {
            throw new Error("Unexpected response data format");
        }
        return responseData;
    }
    // The /txs endpoints
    async txById(id) {
        const responseData = await this.get(`/txs/${id}`);
        if (!responseData.tx) {
            throw new Error("Unexpected response data format");
        }
        return responseData;
    }
    async txsQuery(query) {
        const responseData = await this.get(`/txs?${query}`);
        if (!responseData.txs) {
            throw new Error("Unexpected response data format");
        }
        return responseData;
    }
    /** returns the amino-encoding of the transaction performed by the server */
    async encodeTx(tx) {
        const responseData = await this.post("/txs/encode", tx);
        if (!responseData.tx) {
            throw new Error("Unexpected response data format");
        }
        return responseData;
    }
    /**
     * Broadcasts a signed transaction to the transaction pool.
     * Depending on the client's broadcast mode, this might or might
     * wait for checkTx or deliverTx to be executed before returning.
     *
     * @param tx a signed transaction as StdTx (i.e. not wrapped in type/value container)
     */
    async broadcastTx(tx) {
        const params = {
            tx: tx,
            mode: this.broadcastMode,
        };
        const responseData = await this.post("/txs", params);
        if (!responseData.txhash) {
            throw new Error("Unexpected response data format");
        }
        return responseData;
    }
}
exports.LcdClient = LcdClient;
//# sourceMappingURL=lcdclient.js.map