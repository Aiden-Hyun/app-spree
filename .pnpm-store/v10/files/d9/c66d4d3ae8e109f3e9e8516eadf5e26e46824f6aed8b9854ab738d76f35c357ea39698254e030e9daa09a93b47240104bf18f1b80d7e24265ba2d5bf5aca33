"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.boxShadow = void 0;
var _utilities = require("react-native-css/utilities");
var _handler = require("./_handler.js");
const color = ["color", "string"];
const offsetX = ["offsetX", "number"];
const offsetY = ["offsetY", "number"];
const blurRadius = ["blurRadius", "number"];
const spreadDistance = ["spreadDistance", "number"];
// const inset = ["inset", "string"] as const;

const handler = (0, _handler.shorthandHandler)([[offsetX, offsetY, blurRadius, spreadDistance], [offsetX, offsetY, blurRadius, spreadDistance, color], [color, offsetX, offsetY], [color, offsetX, offsetY, blurRadius, spreadDistance], [offsetX, offsetY, color], [offsetX, offsetY, blurRadius, color]], [], "object");
const boxShadow = (resolveValue, func, get, options) => {
  const args = resolveValue(func[2]);
  if (!(0, _utilities.isStyleDescriptorArray)(args)) {
    return args;
  } else {
    return args.flatMap(flattenShadowDescriptor).map(shadows => {
      if (shadows === undefined) {
        return;
      } else {
        return omitTransparentShadows(handler(resolveValue, shadows, get, options));
      }
    }).filter(v => v !== undefined);
  }
};
exports.boxShadow = boxShadow;
function flattenShadowDescriptor(arg) {
  if ((0, _utilities.isStyleDescriptorArray)(arg) && (0, _utilities.isStyleDescriptorArray)(arg[0])) {
    return arg.map(arg => {
      return flattenShadowDescriptor(arg);
    });
  }
  return [arg];
}
function omitTransparentShadows(style) {
  if (typeof style === "object" && style && "color" in style) {
    if (style.color === "#0000" || style.color === "transparent") {
      return;
    }
  }
  return style;
}
//# sourceMappingURL=box-shadow.js.map