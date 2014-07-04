<!DOCTYPE html>
<html lang="en" ng-app="mddocApp">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="">
        <meta name="author" content="">
    <!--    <link rel="shortcut icon" href="../../docs-assets/ico/favicon.png">-->

        <title>Md Doc</title>

        <!-- Bootstrap core CSS -->
        <link href="css/bootstrap.css" rel="stylesheet">

        <!-- Custom styles for this template -->
        <link href="css/md-doc.css" rel="stylesheet">

        <!-- Syntax highlighting -->
<!--        <link rel="stylesheet" href="http://yandex.st/highlightjs/7.5/styles/default.min.css" />-->
        <link rel="stylesheet" href="css/highlightjs-7.5.min.css" />

        <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
        <!--[if lt IE 9]>
            <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
            <script src="https://oss.maxcdn.com/libs/respond.js/1.3.0/respond.min.js"></script>
        <![endif]-->
    </head>

    <body ng-controller="mainCtrl">
        <div class="navbar navbar-inverse navbar-fixed-top" role="navigation">
            <div class="container">
                <div class="navbar-header">
                    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                        <span class="sr-only">Toggle navigation</span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>
                    <a class="navbar-brand" ng-click="alert()">Md Doc</a>
                </div>
                <div class="navbar-collapse collapse">
                    <ul class="nav navbar-nav">
                        <li><a nav-btn="main">Home</a></li>
                        <li><a nav-btn="comment_programming">Comment Programming</a></li>
                        <li><a nav-btn="blog">Blog</a></li>
                        <li><a nav-btn="concepts">Concepts</a></li>
                        <li><a nav-btn="mini_estructura">Mini estructura</a></li>
                        <li><a href="/jsdoc">jsdoc</a></li>
                    </ul>
                </div><!--/.navbar-collapse -->
            </div>
        </div>
        <div ui-view="jumbobar" class="slide">

        </div>
        <div class="container">
            <div ui-view="container" class="slide">

            </div>
            <footer>
                <p>&copy; Kalite Systems 2014</p>
            </footer>
        </div>



        <!-- Bootstrap core JavaScript
        ================================================== -->
        <!-- Placed at the end of the document so the pages load faster -->
        <script src="js/jquery-2.0.3.js"></script>
        <script src="js/bootstrap.min.js"></script>
        <script src="js/angular.js"></script>
        <script src="js/angular-animate-1.2.4.js"></script>
        <script src="js/angular-ui-router.js"></script>
        <script src="js/angular-ui-bootstrap-0.7.0.js"></script>
        <script src="js/angular-ui-bootstrap-tpls-0.7.0.js"></script>
        <script src="js/highlightjs-7.5.js"></script>

        <script src="js/app.js"></script>
        <script type="text/javascript">
            var fragments =<%- @documentor.exportFragmentJson() %>;
        </script>

    </body>
</html>
