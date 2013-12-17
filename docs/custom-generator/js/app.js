/* global angular, $, document, hljs */
var app = angular.module("mddocApp", ["ui.router","ui.bootstrap", "ngAnimate"]);

app.config(function($stateProvider, $urlRouterProvider) {
        // For any unmatched url, redirect to /
        $urlRouterProvider.otherwise("/");

        // Now set up the states
        $stateProvider
            .state("main", {
                url: "/",
                views: {
                    jumbobar: {
                        templateUrl: "main-jumbo.html"
                    },
                    container: {
                        templateUrl: "main.html"
                    }
                }
            })
            .state("comment_programming", {
                url: "/comment_programming",
                views: {
                    container: {
                        templateUrl: "comment_programming.html"
                    }
                }
            })
            .state("blog", {
                url: "/blog",
                views: {
                    container : {
                        templateUrl: "blog.html"
                    }
                }
            })
            .state("concepts", {
                url: "/concepts",
                views: {
                    container : {
                        templateUrl: "concepts.html"
                    }
                }
            })
            .state("mini_estructura", {
                url: "/mini-estructura",
                views: {
                    container : {
                        templateUrl: "mini_estructura.html"
                    }
                }
            })
            .state("fragment", {
                url: "/fragment/{fragmentName:[a-zA-Z-_.\/]*}",
                views: {
                    container : {
                        templateUrl: function (attrs) {
                            return "fragment/" + attrs.fragmentName + ".html";
                        }
                    }
                }
            });

    })
    .run(function() { // instance-injector
    // This is an example of a run block.
    // You can have as many of these as you want.
    // You can only inject instances (not Providers)
    // into the run blocks
});

app.controller("mainCtrl", function($scope, $compile) {
    $scope.alert = function() {
        var html = $compile("<concept-map></concept-map>")($scope);
        $("body").append(html);
    };
//    $scope.alert();
});

app.directive("conceptMap", function($state) {
    return {
        restrict: "E",
        scope: {},
        templateUrl: "partials/concept-map.html",
        link: function (scope, elem) {
            function close() {
                $(document).off("keyup", closeHandler);
                elem.remove();
            }
            function closeHandler(e) {
                if (e.keyCode === 27) {
                    close();
                }
            }

            $(document).on("keyup", closeHandler);
            scope.goToConcept = function(concept) {
                close();
                if (concept.hasOwnProperty("state") ) {
                    $state.go(concept.state);
                } else if (concept.hasOwnProperty("fragment") ) {
                    $state.go("fragment", {fragmentName: concept.fragment});
                }

            };

            scope.myConcepts = [{
                title: "Text search",
                description: "The search in text allows you to have more powerful references.",
                fragment: "textSearch",
                pos: {
                    x: "25%",
                    y: "25%"
                }

            },{
                title: "References",
                description: "A reference is what allows you to interconect code and documentation.",
                fragment: "references",
                pos: {
                    x: "75%",
                    y: "25%"
                }
            }, {
                title: "Markdown Parser",
                description: "File that parses markdown",
                fragment: "src/md_parser",
                pos: {
                    x: "25%",
                    y: "75%"
                }
            },
            {
                title: "Code Reader",
                description: "File that reads code.",
                fragment: "src/CodeReader.js",
                pos: {
                    x: "75%",
                    y: "75%"
                }
            },{
                title: "JsonML",
                description: "Markdown structure.",
                fragment: "jsonml",
                pos: {
                    x: "50%",
                    y: "50%"
                }
            }];

        }
    };
});

// Add syntax highlight to code blocks that have a pre without the nohighlight attribute
app.directive("code", function() {
    return {
        restrict: "E",
        link: function (scope, elem) {
            var pre = elem.parent("pre");

            if (pre.length === 0 || pre.attr("nohighlight") === "true") {
                return;
            }

            hljs.highlightBlock(elem[0]);
        }
    };
});

/**
 * Directive that handles route navigation from the navbar. It goes to the selected state when clicked
 * It shows as active when the state change to the desired state.
 */
app.directive("navBtn", function($state) {
    return {
        // This directive intercepts an attribute which value will be the state is linking to
        restrict: "A",
        link: function (scope, elem, attrs) {
            // Get the linked state
            var stateLink = attrs.navBtn;

            // When clicked, go to it
            elem.on("click", function() {
                $state.go(stateLink);
            });

            // If the state change to it, mark it as active, if not, remove that mark
            scope.$on("$stateChangeSuccess", function(event, toState){
                if (toState.name === stateLink) {
                    $(elem).parent("li").addClass("active");
                } else {
                    $(elem).parent("li").removeClass("active");
                }
            });
        }

    };
});
