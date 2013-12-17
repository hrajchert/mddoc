# Code References

The main feature of this tool is to provide a way to reference other parts of the project, either code or other pieces of documentation (FEATURE TODO).

The references come from the documentation to the code. The reason behind that is that code should be beautiful by itself, and documentation shouldnt get
in the way.

The documentation is written in markdown, which doesn't provide a native way to create a reference, so we extended the language
using an object like this:

    {%directive
        <valid json>
    %}

The reference should be without any margin.
{: .alert .alert-warning }

They are represented as json because...

They will have kind of types/classes that will help identify if they are an example, explanation, decision making information, etc.
