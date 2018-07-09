# konigsburg

Repository for the FoodWeb hackathon graph experiment

## Background
Given:
* A complex graph describing a relatively simple underlying path with abundant variations, with a matrix representation of its connectivity (i.e., an edge matrix)
We can:
* Reorder the graph to “most forward-travelling order”
  * In matrix form, we are minimizing the sum of the elements under the diagonal
* Group elements simply
  * To group nodes 2 and 3, take the edge matrix, take row 2 and row 3, combine by summing corresponding elements in each; similarly with columns 2 and 3 (order of these two operations is irrelevant
This means: If we have an "expected path":
* Nodes between those in the “expected path,” when in ideal order, often should be groupable based simply on their ordering
* We think this is the case, but hasn’t been demonstrated yet
* Would like to demonstrate dynamically


** Goals
* Put together a dynamic graph visualization that lets one take a large, complex graph, and allow one to:
  * Put the graph in optimal order
  * Dynamically change graph order
  * Dynamically group/ungroup elements in the graph
    * Maybe automatically with “core path” specification
  With all changes reflected in the graph vis
* Ideal comparison:
  * Force-directed vis vs
  * Ordered vis vs
  * Ordered and aggregated vis
