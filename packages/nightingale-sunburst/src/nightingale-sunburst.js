import { LitElement, html } from "lit-element";
import {
  select,
  partition as d3partition,
  hierarchy,
  scaleOrdinal,
  quantize,
  interpolateRainbow,
} from "d3";

const superkingdoms = ["bacteria", "viruses", "archaea", "eukaryota", null];

const partition = (data, radius, attribute) => {
  const h = hierarchy(data).sort((a, b) => b[attribute] - a[attribute]);
  return d3partition().size([2 * Math.PI, radius])(h);
};

const getValue = (d, attributeName) => {
  if (d[attributeName]) return d[attributeName];
  if (!d.children) return 0;
  return d.children.reduce(
    (agg, item) => agg + getValue(item, attributeName),
    0
  );
};

const prepareTreeData = (node, depth, maxDepth, weightAttribute) => {
  if (!node) return node;

  const preparedNode = { ...node };

  preparedNode.value = node?.[weightAttribute];

  if (depth >= maxDepth && preparedNode?.children?.length) {
    preparedNode._children = preparedNode.children;
    preparedNode.children = null;
  } else if (preparedNode?._children?.length) {
    preparedNode.children = preparedNode._children;
    preparedNode._children = null;
  }

  if (preparedNode?.children?.length) {
    const newChildren = [];
    for (const child of preparedNode.children) {
      newChildren.push(
        prepareTreeData(child, depth + 1, maxDepth, weightAttribute)
      );
    }
    preparedNode.children = newChildren;
  }
  return preparedNode;
};
const getLineageFromNode = (node, attributeName, attributeID) => {
  if (!node.parent) {
    return [
      {
        name: node.data[attributeName],
        id: node.data[attributeID],
      },
    ];
  }
  return [
    ...getLineageFromNode(node.parent, attributeName, attributeID),
    {
      name: node.data[attributeName],
      id: node.data[attributeID],
    },
  ];
};

const getDistanceOfPointsInRadians = (point1, point2) => {
  const angle = Math.abs(point1.angle - point2.angle) / 2;
  return 2 * point1.radius * Math.sin(angle);
};

class NightingaleSunburst extends LitElement {
  static properties = {
    side: { type: Number },
    "weight-attribute": { type: String },
    "weight-attribute-label": { type: String },
    "name-attribute": { type: String },
    "id-attribute": { type: String },
    "max-depth": { type: Number },
    "font-size": { type: Number },
    "show-label": { type: Boolean },
  };

  constructor() {
    super();
    this.side = 100;
    this["weight-attribute"] = "value";
    this["weight-attribute-label"] = "Value";
    this["name-attribute"] = "name";
    this["id-attribute"] = "id";
    this["max-depth"] = Infinity;
    this["font-size"] = 10;
    this.activeSegment = null;
    this.holdSegment = false;
    this.topOptions = superkingdoms;

    this.handleMousemove = (event) => {
      if (!this.root || (this.activeSegment && this.holdSegment)) return;
      this.selectNodeByPosition(
        event.offsetX - this.side / 2,
        event.offsetY - this.side / 2
      );
    };

    this.handleClick = (event) => {
      if (!this.root) return;
      this.holdSegment = !this.holdSegment;
      if (!this.holdSegment) {
        this.selectNodeByPosition(
          event.offsetX - this.side / 2,
          event.offsetY - this.side / 2
        );
      }
    };
  }

  prepareTree() {
    if (!this._data) return;
    this.dataWithValues = prepareTreeData(
      this._data,
      0,
      this["max-depth"],
      this["weight-attribute"]
    );
    this.root = partition(
      this.dataWithValues,
      this.side / 2,
      this["weight-attribute"]
    );
  }

  set data(value) {
    if (value !== this._data) {
      this._data = value;
      this.prepareTree();
      this.renderCanvas();
    }
  }

  get data() {
    return this._data;
  }

  colorFn() {
    return scaleOrdinal(
      quantize(interpolateRainbow, this.topOptions.length + 1)
    ).domain(this.topOptions.map((_, i) => i));
  }

  getColor(node) {
    if (node.depth === 1) {
      return this.getColorBySuperKingdom(node.data[this["name-attribute"]]);
    }
    return this.getColor(node.parent);
  }

  // eslint-disable-next-line class-methods-use-this
  getColorBySuperKingdom(name) {
    return this.colorFn()(this.topOptions.indexOf(name?.toLowerCase() || null));
  }

  updated(changedProperties) {
    if (
      changedProperties.has("side") ||
      changedProperties.has("max-depth") ||
      changedProperties.has("weight-attribute")
    ) {
      this.prepareTree();
    }
    this.renderCanvas();
  }

  renderCanvas() {
    const canvas = select(this).select("canvas");
    if (!canvas.node() || !this._data) return;
    const context = canvas.node().getContext("2d");
    const width = this.side;
    const height = this.side;

    context.clearRect(0, 0, width, height);
    context.strokeStyle = "white";
    if (!this.root) return;
    this.renderArcs(context, width, height);
    this.renderLabels(context, width, height);
    if (this["show-label"]) {
      this.renderActiveSegmentInfo(context);
    }
  }

  renderArcs(context, width, height) {
    for (const segment of this.root
      .descendants()
      .filter((d) => d.depth && d.depth <= this["max-depth"])) {
      // Initialize path
      context.beginPath();

      context.lineWidth = 1;
      context.globalAlpha = 0.9 - (segment.depth - 1) * 0.05;
      const tmpLineW = context.lineWidth;
      const tmpAlpha = context.globalAlpha;

      // Set the color:
      context.fillStyle = this.getColor(segment);

      // Build the arc segment
      context.arc(width / 2, height / 2, segment.y1, segment.x0, segment.x1);
      context.arc(
        width / 2,
        height / 2,
        segment.y0,
        segment.x1,
        segment.x0,
        true
      );
      if (
        segment.data[this["id-attribute"]] ===
        this.activeSegment?.data?.[this["id-attribute"]]
      ) {
        context.lineWidth = 4;
        context.globalAlpha = 1;
      }
      // Show the stroke
      context.stroke();
      context.fill();
      context.lineWidth = tmpLineW;
      context.globalAlpha = tmpAlpha;
    }
  }

  renderLabels(context, width, height) {
    context.fillStyle = "black";
    context.font = `${this["font-size"]}px Arial`;
    context.textBaseline = "middle";
    context.textAlign = "center";
    const labelsToDisplay = this.root
      .descendants()
      .filter(
        (d) =>
          d.depth &&
          d.depth <= this["max-depth"] &&
          ((d.y0 + d.y1) / 2) * (d.x1 - d.x0) > 10
      );
    for (const segment of labelsToDisplay) {
      const angle = (segment.x0 + segment.x1) / 2;
      const r = (segment.y0 + segment.y1) / 2;
      context.save();
      context.translate(width / 2, height / 2);
      context.rotate(angle);
      context.translate(r, 0);
      let shouldRotate = false;
      let spaceAvailableToDraw = segment.y1 - segment.y0;
      // If it's more than a 1/4 of the circle so draw it horizontally
      if (Math.abs(segment.x1 - segment.x0) > Math.PI / 2) {
        shouldRotate = true;
      } else {
        const availableWidth = getDistanceOfPointsInRadians(
          { angle: segment.x0, radius: segment.y0 },
          { angle: segment.x1, radius: segment.y0 }
        );
        // If there is more space horizontally than verically then rotate
        if (availableWidth > segment.y1 - segment.y0) {
          shouldRotate = true;
          spaceAvailableToDraw = availableWidth;
        }
      }
      if (shouldRotate) {
        context.rotate(Math.PI / 2);
        if (angle > 0 && angle < Math.PI) {
          context.rotate(Math.PI);
        }
      }
      // rotate left side to make it readable
      else if (angle > Math.PI / 2 && angle < 1.5 * Math.PI) {
        context.rotate(Math.PI);
      }

      context.fillText(
        segment.data[this["name-attribute"]] ||
          (segment.data.rank ? `[No ${segment.data.rank}]` : "No name"),
        0,
        0,
        segment.data[this["id-attribute"]] ===
          this.activeSegment?.data?.[this["id-attribute"]]
          ? undefined
          : spaceAvailableToDraw - 2
      );
      context.restore();
    }
  }

  renderActiveSegmentInfo(context) {
    if (this.activeSegment) {
      context.textAlign = "left";
      context.font = "bold 12px Arial";
      context.fillText("Name:", 10, 10);
      context.fillText(this["weight-attribute-label"], 10, 40);
      context.font = "12px Arial";
      context.fillText(this.activeSegment.data[this["name-attribute"]], 15, 25);
      context.fillText(
        getValue(this.activeSegment.data, this["weight-attribute"]),
        15,
        55
      );
    }
  }

  selectNodeByPosition(x, y) {
    const h = Math.sqrt(x * x + y * y);
    const angle1 = x === 0 ? 0 : Math.atan(y / x);
    const angle2 = y === 0 ? 0 : Math.atan(x / y);
    const prev = this.activeSegment;
    this.activeSegment = null;
    this.root
      .descendants()
      .filter((d) => d.depth)
      .forEach((d) => {
        // if is in the right ring
        let angle = 0;
        if (d.y1 > h && h > d.y0) {
          if (x > 0 && y > 0) angle = angle1;
          else if (x < 0 && y > 0) {
            angle = Math.PI / 2 + Math.abs(angle2);
          } else if (x < 0 && y < 0) {
            angle = Math.PI + Math.abs(angle1);
          } else if (x > 0 && y < 0) {
            angle = 1.5 * Math.PI + Math.abs(angle2);
          }
          if (d.x1 > angle && angle > d.x0) this.activeSegment = d;
        }
      });
    if (prev !== this.activeSegment) {
      if (this.activeSegment?.data && !this.activeSegment.data.lineage) {
        this.activeSegment.data.lineage = getLineageFromNode(
          this.activeSegment,
          this["name-attribute"],
          this["id-attribute"]
        );
      }
      this.dispatchEvent(
        new CustomEvent("taxon-hover", {
          detail: this.activeSegment?.data,
          bubbles: true,
          cancelable: true,
        })
      );
      this.renderCanvas();
    }
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.getElementsByTagName("canvas")?.[0].addEventListener(
      "click",
      this.handleClick
    );
    this.getElementsByTagName("canvas")?.[0].addEventListener(
      "mousemove",
      this.handleMousemove
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.getElementsByTagName("canvas")?.[0].removeEventListener(
      "click",
      this.handleClick
    );
    this.getElementsByTagName("canvas")?.[0].removeEventListener(
      "mousemove",
      this.handleMousemove
    );
  }

  render() {
    return html` <canvas width="${this.side}px" height="${this.side}px">
      Nightingale Sunburst
    </canvas>`;
  }
}

export default NightingaleSunburst;
