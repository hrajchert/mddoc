In previous versions, I used to check if the node's range was smaller than the current minSize,
but I later realized that if the node is still "in range", which is analoge to say "not out of range",
the node will always be smaller and smaller in each children.
Thus, I always set this node to be the min node and avoid an extra check

{ % code_ref
    "src" : "src/CodeReader.ts",
    "ref" : {
        "text" : "var size = node.range[1] - node.range[0];"
    }
% }
