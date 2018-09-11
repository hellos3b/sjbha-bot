export default {

    optionalArray(opt) {
        opt = opt || []
        return (Array.isArray( opt )) ?  opt : [opt]
    }  

}