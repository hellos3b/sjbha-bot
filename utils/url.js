export default {

    objToParams(obj) {
        return Object.keys(obj)
            .map(key => key + '=' + encodeURIComponent(obj[key]))
            .join('&')
    },

    get(path, objParams) {
        const baseUrl = (process.env.NODE_ENV === 'production') ?
            process.env.PRODUCTION_HOST :
            `http://localhost:${process.env.PORT}`;

        return baseUrl + path + "?" + this.objToParams(objParams);
    }

}