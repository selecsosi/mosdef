describe("ModuleLoader", function() {
    "use strict";
    var loader, loadedModule;

    beforeEach(function () {
        loader = new ModuleLoader();
    });

    it("Throws correct exception on load error", function () {
        loader.define('Test', [], function () {
            return {
                exportedFunction: function () {
                },
                expectedTrueCall: function () {
                    return true;
                }
            };
        });

        loader.define('Other', ['Test1'], function (Test1) {
            return {
                exportedFunction: function () {
                    return Test1.expectedTrueCall();
                }
            };
        });

        expect(function() {
            loader.loadModules();
        }).toThrowError("Load terminated due to exception");
    });

});