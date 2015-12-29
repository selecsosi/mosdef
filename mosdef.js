(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['_'], function (_) {
            root.ModuleLoader = factory(root, _);
            return root.ModuleLoader;
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(root, require('_'));
    } else {
        // Browser globals
        root.ModuleLoader = factory(root, _);
    }
}(this, function(root, _) {
    "use strict";
    function ModulesNotFound(mesage) {
        this.name = "ModulesNotFound";
        this.message = mesage;
    }
    ModulesNotFound.prototype = new Error();
    ModulesNotFound.prototype.constructor = ModulesNotFound;

    function ModuleDefinitionMissing(mesage) {
        this.name = "ModuleDefinitionMissing";
        this.message = mesage;
    }
    ModuleDefinitionMissing.prototype = new Error();
    ModuleDefinitionMissing.prototype.constructor = ModuleDefinitionMissing;

    var ModuleLoader = function() {
        this.initialize.apply(this, arguments);
    };

    ModuleLoader.prototype = {
        initialize: function() {
            this.moduleList = [];
            this.loadErrorMap = {};
        },
        loadModules: function(callback) {
            var moduleLoadList = this.moduleList.slice(),
                modulesLoaded = [],
                modulesDelayed = [], i, hadSuccessfulLoad;
            while(moduleLoadList.length > 0) {
                hadSuccessfulLoad = false;
                for(i = 0; i < moduleLoadList.length; i++) {
                    var mod = moduleLoadList[i];
                    if(this.tryLoadModule(mod)) {
                        hadSuccessfulLoad = true;
                        modulesLoaded.push(mod);
                    } else {
                        modulesDelayed.push(mod);
                    }
                }
                if(hadSuccessfulLoad) {
                    moduleLoadList = modulesDelayed;
                    modulesDelayed = [];
                } else {
                    break;
                }
            }
            if(modulesDelayed.length > 0) {
                var missingModuleList = [];
                for(i = 0; i < modulesDelayed.length; i++) {
                    missingModuleList.push(modulesDelayed[i].name);
                }
                console.warn("Error loading modules.");
                console.warn(missingModuleList);
                console.warn(this.loadErrorMap);
                throw new ModulesNotFound("Load terminated due to exception");
            }
            if(callback)callback();
        },
        loadDependency: function(name) {
            var namespace = name.split(".");
            var loader = function(parent, namespace) {
                if(namespace.length > 1) {
                    return loader(parent[namespace[0]], namespace.slice(1));
                } else if(namespace.length == 1) {
                    return parent[namespace[0]];
                } else {
                    return null;
                }
            };
            return loader(root, namespace);
        },
        tryLoadDependencies: function(depList) {
            var factoryDeps = [],
                loadError = false,
                //Use different object to hint at response
                errorReport = {
                    exceptions: []
                };
            for(var i = 0; i < depList.length; i++) {
                var dep = depList[i],
                    loadedDependency = null,
                    error = null;
                //Try to load the dependency out of either managed namespaces or
                try {
                    loadedDependency = this.loadDependency(dep);
                } catch (e) {
                    error = e;
                }
                if(loadedDependency === null || typeof loadedDependency == "undefined") {
                    factoryDeps = null;
                    loadError = true;
                    if(error) {
                        errorReport.exceptions.push(error);
                    } else {
                        errorReport.exceptions.push("Missing module " + dep);
                    }
                    break;
                } else {
                    factoryDeps.push(loadedDependency);
                }
            }
            return loadError ? errorReport : factoryDeps;
        },
        tryLoadModule: function(mod) {
            var namespace = mod.name.split("."),
                depsArrayOrError = this.tryLoadDependencies(mod.deps);
            //Array denotes successful load
            if(_.isArray(depsArrayOrError)) {
                var constructedModule = mod.factory.apply(root, depsArrayOrError);
                if(!constructedModule) {
                    throw new ModuleDefinitionMissing("Missing module export for " + mod.name);
                }
                if(!root.hasOwnProperty(namespace[0])) {
                    root[namespace[0]] = {};
                }
                _.merge(root, this.loadModuleIntoNamespace(namespace, mod.factory.apply(root, depsArrayOrError)));
                return true;
            } else if(depsArrayOrError !== null && !_.isArray(depsArrayOrError)) {
                //Report error for lib
                this.loadErrorMap[mod.name] = depsArrayOrError;
                return false;
            } else {
                return false;
            }
        },
        loadModuleIntoNamespace: function(namespace, value) {
            if(namespace.length > 0) {
                var submodule = {};
                submodule[namespace[0]] = this.loadModuleIntoNamespace(namespace.slice(1), value);
                return submodule;
            } else {
                return value;
            }
        },
        define: function(moduleName, deps, factory) {
            if(moduleName) {
                this.moduleList.push({
                    name: moduleName,
                    deps: deps,
                    factory: factory
                });
            } else {
                throw new ModuleDefinitionMissing("Module missing definition");
            }
        }
    };

    return ModuleLoader;
}));

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
