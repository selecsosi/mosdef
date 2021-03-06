describe("ModuleLoader", function() {
    "use strict";
    var loader, loadedModule;

    beforeEach(function() {
        loader = new ModuleLoader();
    });


    it("should be able to load a module into a namespace", function() {
        var testModule = {
            TestSubmodule: {
                thing: ""
            }
        };
        loadedModule = loader.loadModuleIntoNamespace(["TestModule"], testModule);
        expect(loadedModule.hasOwnProperty("TestModule")).toBe(true);
        expect(loadedModule.TestModule).toBe(testModule);
    });

    it("should be able to load a module into a nested namespace", function() {
        var testModule = {
            TestSubmodule: {
                thing: ""
            }
        };
        loadedModule = loader.loadModuleIntoNamespace(["TestModule", "Nesting1", "Nesting2"], testModule);
        expect(loadedModule.hasOwnProperty("TestModule")).toBe(true);
        expect(loadedModule.TestModule.Nesting1.Nesting2).toBe(testModule);
    });

    it("should be able to load modules", function() {
        loader.define('Test', [], function() {
            return {
                exportedFunction: function() {},
                expectedTrueCall: function() {
                    return true;
                }
            };
        });

        loader.loadModules(function() {
            expect(window.hasOwnProperty("Test")).toBe(true);
            expect(Test.expectedTrueCall()).toBe(true);

        });

        delete window.Test;
    });

    it("should be able to load modules with dependencies", function() {
        loader.define('Test', [], function() {
            return {
                exportedFunction: function() {},
                expectedTrueCall: function() {
                    return true;
                }
            };
        });

        loader.define('Other', ['Test'], function(Test) {
            return {
                exportedFunction: function() {
                    return Test.expectedTrueCall();
                }
            };
        });

        loader.loadModules(function() {
            expect(window.hasOwnProperty("Other")).toBe(true);
            expect(Other.exportedFunction()).toBe(true);
        });

        delete window.Test;
        delete window.Other;
    });

    it("should be able to load modules with global dependencies", function() {
        window.globalDep = {
            expectedTrueCall: function() {
                return true;
            }
        };

        //Test module definition
        loader.define('Test', ['globalDep'], function(globalDep) {
            return {
                exportedFunction: function() {
                    return globalDep.expectedTrueCall();
                }
            };
        });

        loader.loadModules(function() {
            expect(window.hasOwnProperty("Test")).toBe(true);
            expect(Test.exportedFunction()).toBe(true);
        });

        delete window.globalDep;
        delete window.Test;
    });
});
