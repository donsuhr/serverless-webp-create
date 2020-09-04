// https://github.com/github/fetch/issues/89#issuecomment-256610849
export default function futch(url, opts = {}, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(opts.method || 'get', url);
        // eslint-disable-next-line no-restricted-syntax,guard-for-in
        for (const k in opts.headers || {}) {
            xhr.setRequestHeader(k, opts.headers[k]);
        }
        xhr.onload = (e) => resolve(e.target.responseText);
        xhr.onerror = reject;
        if (xhr.upload && onProgress) {
            xhr.upload.onprogress = onProgress;
        }
        xhr.send(opts.body);
    });
}
