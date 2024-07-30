var vShaderQuellcode;
var fShaderQuellcode;

var dataLoc;
var hash1Loc;
var midstateLoc;
var targetLoc;
var nonceLoc;

var maxNonce = 0xFFFFFFFF;
var maxCnt = 0;
var reportPeriod = 1000;
var useTimeout = true;
var TotalHashes = 0;
var gl;
var canvas;
var debug = false;
var buf;

var width;
var height;

/**
 * @description Throws an error with a message that includes the OpenGL error code
 * and the name of the WebGL function that caused it, providing information about the
 * source of the error.
 *
 * @param {GLenum} err - An error code returned by WebGL functions.
 *
 * @param {string} funcName - Used to specify the name of a WebGL function.
 *
 * @param {any[]} args - Used to store arguments of the failed WebGL function call.
 */
function throwOnGLError(err, funcName, args) {
    throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" + funcName;
};

/**
 * @description Initializes a WebGL context, creates and compiles shaders for vertex
 * and fragment processing, and sets up uniform variables for cryptographic calculations.
 * It prepares buffers and attributes for rendering, but the purpose is unclear due
 * to the lack of shader source code.
 *
 * @param {number} threads - Used to set the width of the WebGL canvas.
 */
function meinWebGLStart(threads) {
        canvas = document.createElement('canvas');
        if (debug) document.body.appendChild(canvas)
        canvas.height = 1;
        canvas.width = threads;

        var names = [ "webgl", "experimental-webgl", "moz-webgl", "webkit-3d" ];
        for (var i=0; i<names.length; i++) {
            try {
                gl = canvas.getContext(names[i]);
                if (gl) { break; }
            } catch (e) { }
        }

        if(!gl) {
            alert("Fehler: WebGL-Context konnte nicht initialisiert werden");
        }

        var program = gl.createProgram();


        vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader,vShaderQuellcode);
        gl.compileShader(vShader);
        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(vShader));
        }
        gl.attachShader(program,vShader);

        fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader,fShaderQuellcode);
        gl.compileShader(fShader);
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(fShader));
        }
        gl.attachShader(program,fShader);

        gl.linkProgram(program);
        gl.useProgram(program);

        gl.clearColor ( 1.0, 1.0, 1.0, 1.0 );
        gl.clear ( gl.COLOR_BUFFER_BIT );

        var posAtrLoc = gl.getAttribLocation(program, "vPos");
        gl.enableVertexAttribArray( posAtrLoc );

        var h =  [0x6a09, 0xe667, 0xbb67, 0xae85,
                  0x3c6e, 0xf372, 0xa54f, 0xf53a,
                  0x510e, 0x527f, 0x9b05, 0x688c,
                  0x1f83, 0xd9ab, 0x5be0, 0xcd19];

        var k =  [0x428a, 0x2f98, 0x7137, 0x4491,
                  0xb5c0, 0xfbcf, 0xe9b5, 0xdba5,
                  0x3956, 0xc25b, 0x59f1, 0x11f1,
                  0x923f, 0x82a4, 0xab1c, 0x5ed5,
                  0xd807, 0xaa98, 0x1283, 0x5b01,
                  0x2431, 0x85be, 0x550c, 0x7dc3,
                  0x72be, 0x5d74, 0x80de, 0xb1fe,
                  0x9bdc, 0x06a7, 0xc19b, 0xf174,
                  0xe49b, 0x69c1, 0xefbe, 0x4786,
                  0x0fc1, 0x9dc6, 0x240c, 0xa1cc,
                  0x2de9, 0x2c6f, 0x4a74, 0x84aa,
                  0x5cb0, 0xa9dc, 0x76f9, 0x88da,
                  0x983e, 0x5152, 0xa831, 0xc66d,
                  0xb003, 0x27c8, 0xbf59, 0x7fc7,
                  0xc6e0, 0x0bf3, 0xd5a7, 0x9147,
                  0x06ca, 0x6351, 0x1429, 0x2967,
                  0x27b7, 0x0a85, 0x2e1b, 0x2138,
                  0x4d2c, 0x6dfc, 0x5338, 0x0d13,
                  0x650a, 0x7354, 0x766a, 0x0abb,
                  0x81c2, 0xc92e, 0x9272, 0x2c85,
                  0xa2bf, 0xe8a1, 0xa81a, 0x664b,
                  0xc24b, 0x8b70, 0xc76c, 0x51a3,
                  0xd192, 0xe819, 0xd699, 0x0624,
                  0xf40e, 0x3585, 0x106a, 0xa070,
                  0x19a4, 0xc116, 0x1e37, 0x6c08,
                  0x2748, 0x774c, 0x34b0, 0xbcb5,
                  0x391c, 0x0cb3, 0x4ed8, 0xaa4a,
                  0x5b9c, 0xca4f, 0x682e, 0x6ff3,
                  0x748f, 0x82ee, 0x78a5, 0x636f,
                  0x84c8, 0x7814, 0x8cc7, 0x0208,
                  0x90be, 0xfffa, 0xa450, 0x6ceb,
                  0xbef9, 0xa3f7, 0xc671, 0x78f2];

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        var vertices = new Float32Array([1, 1,-1, 1,
                                         1,-1,-1,-1]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(posAtrLoc, 2, gl.FLOAT, false, 0, 0);

        dataLoc = gl.getUniformLocation(program, "data");
        hash1Loc = gl.getUniformLocation(program, "hash1");
        midstateLoc = gl.getUniformLocation(program, "midstate");
        targetLoc = gl.getUniformLocation(program, "target");
        nonceLoc = gl.getUniformLocation(program, "nonce_base");

        var hLoc = gl.getUniformLocation(program, "H");
        var kLoc = gl.getUniformLocation(program, "K");

        gl.uniform2fv(hLoc, h);
        gl.uniform2fv(kLoc, k);
}

/**
 * @description Sends a GET request to the specified URL `n` and upon receiving a
 * response, it executes the provided `callback` function with the response text as
 * an argument, effectively reading the script at the given URL.
 *
 * @param {string} n - URL or path to the script file.
 *
 * @param {any} callback - Called when the XMLHttpRequest operation completes.
 */
function readScript(n, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", n, true);
    xhr.send(null);

    xhr.onload = function () {
        callback(xhr.responseText);
    }
};

/**
 * @description Reads two JavaScript files, 'shader-vs.js' and 'shader-fs.js', and
 * stores their contents in variables `vShaderQuellcode` and `fShaderQuellcode`, respectively.
 */
function onl() {
    readScript('shader-vs.js', function (data) {
        // Reads and sets a shader source code.

        vShaderQuellcode = data;
    });

    readScript('shader-fs.js', function (data) {
        // Loads and assigns shader script content.

        fShaderQuellcode = data;
    });
};

/**
 * @description Mines for digital coins using a WebGL context. It iterates over a
 * canvas, processing pixels and searching for hashes that meet a target value. When
 * a hash is found, it submits it to a callback and updates the total hashes count.
 *
 * @param {object} job - Used to contain data necessary for mining operations.
 *
 * @param {(job: object) => void} callback - Used to report job results.
 *
 * @returns {Function} A reference to the `mine` function. The `mine` function starts
 * the mining process and returns an event handler (`intMessage`) for handling messages
 * from workers.
 */
function glminer(job, callback) {
    var run = true;

    /**
     * @description Implements a proof-of-work algorithm to mine for cryptographic nonces,
     * submitting them through the provided callback. It iterates over pixels in a WebGL
     * canvas, checks for matching conditions, and updates the nonce value accordingly.
     *
     * @param {object} job - Used to hold various data for mining purposes.
     *
     * @param {any} callback - Used to notify of job completion.
     */
    var next_run = function(job, callback) {
        var nonces_per_pixel = 1;
        var t = job.t === undefined ? 0 : job.t;
        var nonce = job.nonce === undefined ? 0 : job.nonce;
        var threads = width * nonces_per_pixel;
        var curCnt = 0;
        var x = 0;
        var y = 0;
        var n;

        /**
         * @description Converts a job's nonce into an array, updates the job data with these
         * values, concatenates half and data arrays, transforms them into a pool string,
         * sets the golden ticket, and calls the callback function with the updated job.
         */
        var submit_nonce = function() {
            n = derMiner.Util.to_uint16_array(job.nonce);

            job.data[6] = n[0];
            job.data[7] = n[1];

            var r = [];
            for (var j = 0; j < job.half.length; j++)
                r.push(job.half[j]);
            for (var j = 0; j < job.data.length; j++)
                r.push(job.data[j]);

            var ret = derMiner.Util.toPoolString(r, true);

            job.golden_ticket = ret;
            callback(job);
        }

        while(run) {
            n = derMiner.Util.to_uint16_array(nonce);
            gl.uniform2fv(nonceLoc,  n);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            if (debug) console.log("w:" + width + " h:" + height);

            gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buf);

            for (var i=0; i<buf.length; i+=4) {
                if (debug) {
                    var out = [];
                    out.push(derMiner.Util.byte_to_hex(buf[i]));
                    out.push(derMiner.Util.byte_to_hex(buf[i+1]));
                    out.push(derMiner.Util.byte_to_hex(buf[i+2]));
                    out.push(derMiner.Util.byte_to_hex(buf[i+3]));
                    console.log("rgba("+(i/4)+"): " + JSON.stringify(out));
                }

                if (nonces_per_pixel == 1) {
                    if (buf[i] == 0 &&
                        buf[i+1] == 0 &&
                        buf[i+2] == 0 &&
                        buf[i+3] == 0) {

                        job.nonce = nonce + i * (nonces_per_pixel / 4);
                        submit_nonce();
                    }
                } else {
                    if (buf[i] != 0 ||
                        buf[i+1] != 0 ||
                        buf[i+2] != 0 ||
                        buf[i+3] != 0) {
                        for (var e = 0; e < 4; e++) {
                            for (var r = 7; r >= 0; r--) {
                                if (buf[i + e] & 1 << r) {
                                    var b = (3 - e) * (nonces_per_pixel / 4) + r;
                                    job.nonce = nonce + i * (nonces_per_pixel / 4) + b;
                                    submit_nonce();
                                }
                            }
                        }

                        job.golden_ticket = null;
                    }
                }
            }

            if (nonce >= maxNonce) {
                cb(null);
                break;
            }

            nonce+= threads;
            TotalHashes += threads;

            if (t < (new Date()).getTime()) {
                t = (new Date()).getTime() + reportPeriod;
                job.total_hashes = TotalHashes;
                callback(job);
                TotalHashes = 0;
            }

            if (useTimeout && ++curCnt > maxCnt) {
                curCnt = 0;
                job.nonce = nonce;
                job.t = t;
                /**
                 * @description Schedules a job for execution using the `next_run` function and passes
                 * it a callback function. The `next_run` function is likely responsible for queuing
                 * or executing the job at a later time, with the callback providing a way to handle
                 * any subsequent results or errors.
                 */
                var c = function() {
                    next_run(job, callback);
                }
                window.setTimeout(c, 1);
                return;
            }
        }
    }
    /**
     * @description Checks whether an event's data object is present and has a `run`
     * property. If not, it sets a global `run` variable to `false`, logs a message
     * indicating forced quit, and returns without executing further code.
     *
     * @param {object} event - Passed from an external source.
     */
    var intMessage = function(event) {
        if (!event.data || !event.data.run) {
            run = false;
            console.log("worker: forced quit!");
            return;
        }
    };

    /**
     * @description Sets up uniform variables for a WebGL program with data from a job
     * object, then initializes an array buffer and calls the `next_run` function with
     * the job and callback, returning an integer message.
     *
     * @param {object} job - Used to set uniforms for OpenGL rendering.
     *
     * @param {Function} callback - Invoked after the job has been processed.
     *
     * @returns {object} `intMessage`.
     */
    var mine = function(job, callback) {

        gl.uniform2fv(dataLoc, job.data);
        gl.uniform2fv(hash1Loc, job.hash1);
        gl.uniform2fv(midstateLoc, job.midstate);
        gl.uniform2fv(targetLoc, job.target);

        width = canvas.width;
        height = canvas.height;

        buf = new Uint8Array(width * height * 4);

        next_run(job, callback);
        return intMessage;
    }

    /**
     * @description Checks whether a given hash value is within a certain range, defined
     * by the target value. It converts both values to unsigned integers and returns true
     * if the hash value is less than or equal to the target value, indicating a successful
     * mining attempt.
     *
     * @param {string} hash - 32 bytes long.
     *
     * @param {string} target - 8 bytes long.
     *
     * @returns {boolean} True if the input hash value is less than or equal to the target
     * value and false otherwise.
     */
    var is_golden_hash = function(hash, target) {
        var u1 = derMiner.Util.ToUInt32(hash);
        var u2 = derMiner.Util.ToUInt32(target[6]);

        console.log("worker: checking " + u1 + " <= " + u2);
        return (u1 <= u2);
    }

    return mine(job, callback);
};
