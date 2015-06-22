(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['_'], function (_) {
            root.ModuleLoader = factory(root, _);
            return root.ModuleLoader;
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
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
        this.name = "ModulesNotFound";
        this.message = mesage;
    }
    ModuleDefinitionMissing.prototype = new Error();
    ModuleDefinitionMissing.prototype.constructor = ModuleDefinitionMissing;

    var ModuleLoader = function(globalExportName) {
        this.initialize.apply(this, arguments);
    };

    ModuleLoader.prototype = {
        initialize: function(globalExportName) {
            this.globalExportName = globalExportName;
            this.useGlobalExportNamespace = !!this.globalExportName;
            this.moduleList = [];
            if(this.useGlobalExportNamespace){
                //Begin constructing a global loader
                root[this.globalExportName] = root[this.globalExportName] || {};
            }
        },
        loadModules: function(callback) {
            var moduleLoadList = this.moduleList.slice(),
                modulesLoaded = [],
                modulesDelayed = [], i, result, module, hadSuccessfulLoad;
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
                throw new ModulesNotFound(missingModuleList.join(","));
            }
            if(callback)callback();
        },
        loadDependency: function(name, global) {
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
            if(global) {
                return loader(root, namespace);
            } else {
                return loader(root[this.globalExportName], namespace);
            }
        },
        tryLoadDependencies: function(depList) {
            var factoryDeps = [];
            for(var i = 0; i < depList.length; i++) {
                var dep = depList[i],
                    loadedDependency = null;
                try {
                    loadedDependency = this.loadDependency(dep);
                } catch (e) {}

                if(loadedDependency === null || typeof loadedDependency == "undefined") {
                    try {
                        loadedDependency = this.loadDependency(dep, true);
                    } catch (e) {}
                }
                if(loadedDependency === null || typeof loadedDependency == "undefined") {
                    factoryDeps = null;
                    break;
                } else {
                    factoryDeps.push(loadedDependency);
                }
            }
            return factoryDeps;
        },
        tryLoadModule: function(mod, loadedDeps) {
            var namespace = mod.name.split("."),
                deps = this.tryLoadDependencies(mod.deps);
            if(deps !== null) {
                var constructedModule = mod.factory.apply(root, deps);
                if(!constructedModule) {
                    throw new ModuleDefinitionMissing("Missing module export for " + mod.name);
                }
                if(this.useGlobalExportNamespace) {
                    //Test for existence of a module that has already been loaded into that namespace or do we need
                    //to construct a new
                    if(!root[this.globalExportName].hasOwnProperty(namespace[0])) {
                        root[this.globalExportName][namespace[0]] = {};
                    }
                } else {
                    if(!root.hasOwnProperty(namespace[0])) {
                        root[namespace[0]] = {};
                    }
                }
                _.merge(this.useGlobalExportNamespace ?  root[this.globalExportName] : root, this.loadModuleIntoNamespace(namespace, mod.factory.apply(root, deps)));
                return true;
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
        // only CommonJS-like enviroments that support module.exports,
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
