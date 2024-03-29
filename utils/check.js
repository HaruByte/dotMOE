/**
 * This is custom middleware for verifying received post.
 * As you can see, failed check sending 200 (OK) response to the webhook server.
 * Welp, what i read on the documentation is that the receiver must sending 200 response,
 * otherwise the webhook server will trying to send the same post again if not receiving 200 response.
 * <br>
 * APP_TOKEN env is your Meta app secret token.
 * 
 * @file
 * @author AozoraDev
 */
 /** @module utils/check */

const crypto = require("crypto");
require("dotenv").config();

/**
 * Middleware for verifying received post by using SHA256 signature
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - The third argument that is passed to the middleware function
 * @returns {void}
 */
function authorization(req, res, next) {
    const hmac = crypto.createHmac("sha256", process.env.APP_TOKEN)
        .update(req.rawBody) // See index.js line 24
        .digest("hex");
    
    /** @const {string} signature - SHA256 signature from received post */
    const signature = req.headers["x-hub-signature-256"];
    /** @const {string} expectedSignature - Signature generated by client */
    const expectedSignature = `sha256=${hmac}`;
    
    if (signature !== expectedSignature) {
        return res.sendStatus(200);
    }
    
    next();
}

/**
 * Middleware for checking what kind of post should be accepted.
 * For now, only accepting post with image(s) and caption
 * 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - The third argument that is passed to the middleware function
 * @returns {void}
 */
function validation (req, res, next) {
    /** @const {?Object} data - Object data of received post */
    const data = req.body.entry?.[0].changes?.[0].value;
    
    // Make sure the received data is really a post type and not others like comment or reaction.
    // Also, make sure it was new data (verb add) and not edited data.
    if ((data.field !== "feed" && data.verb !== "add") || !data.post_id) {
        return res.sendStatus(200);
    }
    
    // Make sure the received post has url in the caption and attachments (images)
    const regex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;
    if (!String(data.message).match(regex) || !(data.photos || data.photo_id)) {
        return res.sendStatus(200);
    }
    
    next();
}

module.exports = {
    authorization,
    validation
}