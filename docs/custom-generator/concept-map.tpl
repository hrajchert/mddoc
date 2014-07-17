<div class="map" >
    <svg width="100%" height="100%"
         xmlns="http://www.w3.org/2000/svg"
         xmlns:xhtml="http://www.w3.org/1999/xhtml"
         xmlns:xlink="http://www.w3.org/1999/xlink"
         version="1.1">

        <g>
            <title>{{ myConcept.title }}</title>
            <!-- Center -->

            <g transform="translate(-125, -62.5)" ng-repeat="concept in myConcepts">
                <svg ng-attr-x="{{ concept.pos.x }}"  ng-attr-y= "{{ concept.pos.y}}" ng-click="goToConcept(concept)">
                    <rect fill="#428bca" stroke="#000000" x="0" y="0" width="250" height="25" />
                    <rect fill="#86abc9" stroke="#000000" x="0" y="25" width="250" height="100"/>
                    <text text-anchor="middle"
                          font-family="Helvetica Neue"
                          font-size="14"
                          y="19"
                          x="125"
                          fill="#ffffff">{{concept.title}}
                    </text>
                    <foreignObject x="5" y="30" width="240" height="90">
                        <xhtml:div style="display: table; height: 90px; overflow: hidden;">
                            <xhtml:div style="display: table-cell; vertical-align: middle;">
                                <xhtml:div style="color:black; text-align:center;">
                                    {{ concept.description}}
                                </xhtml:div>
                            </xhtml:div>
                        </xhtml:div>
                    </foreignObject>

                </svg>
            </g>



<!--            <rect id="svg_1" height="50" width="50" y="50%" x="50%" stroke-width="5" stroke="#000000" fill="#7f7f7f"/>-->
        </g>
    </svg>
</div>
<div class="buttons">
    <a class="btn btn-primary">Help</a>
</div>
