I added this because a gulp task was executing the generator multiple times when in watch. The problem was that now the GeneratorManager is
a singleton and aparently the initialize was being called multiple times. Although this does no harm, I don't quite like it.

{%code_ref
    "src" : "src/generator/generator-manager.ts",
    "ref" : {
        "text" : "if (this.initialized) {"
    }
%}



**Warning:**
I want to remove the metadata as the first argument. Right now, I think its only being used
in the HtmlFragmentGenerator. But I should be able to give the metadata in the generate method.
I think there is/was a problem with the metadata object being out of date from instantiation to
the later on generate method.
{:.alert .alert-danger }

{%code_warning
    "src" : "src/generator/generator-manager.ts",
    "ref" : {
        "text" : "generatorFactory.createGenerator("
    }
%}
