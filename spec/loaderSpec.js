describe("ModuleLoader", function() {
    var loader;

    beforeEach(function() {
        loader = new ModuleLoader("TestNamespace");
    });

    afterEach(function() {
        delete window["TestNamespace"];
    });

    it("should be able to load a module into a namespace", function() {
        var testModule = {
            TestSubmodule: {
                thing: ""
            }
        }
        loadedModule = loader.loadModuleIntoNamespace(["TestModule"], testModule);
        expect(loadedModule.hasOwnProperty("TestModule")).toBe(true);
        expect(loadedModule.TestModule).toBe(testModule);
    });

    it("should be able to load a module into a nested namespace", function() {
        var testModule = {
            TestSubmodule: {
                thing: ""
            }
        }
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
            expect(window.hasOwnProperty("TestNamespace")).toBe(true);
            expect(TestNamespace.hasOwnProperty("Test")).toBe(true);
            expect(TestNamespace.Test.expectedTrueCall()).toBe(true);
        });
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
            expect(window.hasOwnProperty("TestNamespace")).toBe(true);
            expect(TestNamespace.hasOwnProperty("Other")).toBe(true);
            expect(TestNamespace.Other.exportedFunction()).toBe(true);
        });
    });

    it("should be able to load modules with global dependencies", function() {
        window["globalExport"] = {
            expectedTrueCall: function() {
                return true;
            }
        }

        loader.define('Test', ['globalExport'], function(glbExport) {
            return {
                exportedFunction: function() {
                    return glbExport.expectedTrueCall();
                }
            };
        });

        loader.loadModules(function() {
            expect(window.hasOwnProperty("TestNamespace")).toBe(true);
            expect(TestNamespace.hasOwnProperty("Test")).toBe(true);
            expect(TestNamespace.Test.exportedFunction()).toBe(true);
        });
    });
});
