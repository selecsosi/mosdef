/**
 * Exports a mosDef helper method to the global namespace
 * this helper works kind of like a `define` method from require
 * some example usage is like
 *
 * mosDef(['Namepace.NestingSupported'],
 * ['Requirements', 'supportsGlobalLookups', 'like', 'jQuery', Backbone',
 *  'orOtherMosDefDefinedLibs', 'OtherNamespace.Views'],
 * function(Requirements, ..., OtherViews) {
 *     var Module = {};
 *     Module.exportedFunction = function() {
 *         return new OtherView.Widget();
 *     };
 *     return Module;
 * });
 *
 * mosDef(['NextModule'],
 * ['Namepace.NestingSupported'],
 * function(OtherLib) {
 *     var Module = {};
 *     Module.callingIntoOtherLib = function() {
 *         return OtherLib.exportedFunction();
 *     };
 *     return Module;
 * });
 *
 * mosDef(['ResolvesDependencies'],
 * ['NextModule'],
 * function(NextModule) {
 *     var Module = {};
 *     Module.buildWidget = function() {
 *         return NextModule.exportedFunction();
 *     };
 *     return Module;
 * });
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['ModuleLoader'], function (ModuleLoader) {
            var exp = factory(ModuleLoader);
            root.MosDef = exp.MosDef;
            root.mosDef = exp.mosDef;
            return exp;
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require(['ModuleLoader']));
    } else {
        // Browser globals
        var exp = factory(ModuleLoader);
        root.MosDef = exp.MosDef;
        root.mosDef = exp.mosDef;
    }
}(this, function(ModuleLoader) {
    // Constructs the MosDef module loading instance
    // This will export all of the loaded libraries into the global namespace.
    // This is essentially a convenience wrapper to not have to construct a ModuleLoader
    var MosModuleLoader = new ModuleLoader();
    return {
        MosDef: {
            ModuleLoader: MosModuleLoader
        },
        mosDef: ModuleLoader.prototype.define.bind(MosModuleLoader)
    };
}));
