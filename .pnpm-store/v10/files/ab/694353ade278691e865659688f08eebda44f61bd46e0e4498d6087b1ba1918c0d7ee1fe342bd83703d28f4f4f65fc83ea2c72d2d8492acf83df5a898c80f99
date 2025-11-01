"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStyledProps = getStyledProps;
exports.stylesFamily = void 0;
var _utilities = require("react-native-css/utilities");
var _interaction = require("../react/interaction.js");
var _reactivity = require("../reactivity.js");
var _calculateProps = require("./calculate-props.js");
/* eslint-disable */

const stylesFamily = exports.stylesFamily = (0, _reactivity.family)((hash, rules) => {
  const sortedRules = Array.from(rules).sort(_utilities.specificityCompareFn);
  const obs = (0, _reactivity.observable)(read => (0, _calculateProps.calculateProps)(read, sortedRules));

  /**
   * A family is a map, so we need to cleanup the observers when the the hash is no longer used
   */
  return Object.assign(obs, {
    cleanup: effect => {
      obs.observers.delete(effect);
      if (obs.observers.size === 0) {
        stylesFamily.delete(hash);
      }
    }
  });
});
function getStyledProps(state, inline) {
  let result;
  const styledProps = state.stylesObs?.get(state.styleEffect);
  for (const config of state.configs) {
    result = deepMergeConfig(config, nativeStyleMapping(config, styledProps?.normal), inline, true);
    if (styledProps?.important) {
      result = deepMergeConfig(config, result, nativeStyleMapping(config, styledProps.important));
    }

    // Apply the handlers
    if (_reactivity.hoverFamily.has(state.ruleEffectGetter)) {
      result ??= {};
      result.onHoverIn = (0, _interaction.getInteractionHandler)(state.ruleEffectGetter, "onHoverIn", inline?.onHoverIn);
      result.onHoverOut = (0, _interaction.getInteractionHandler)(state.ruleEffectGetter, "onHoverOut", inline?.onHoverOut);
    }
    if (_reactivity.activeFamily.has(state.ruleEffectGetter)) {
      result ??= {};
      result.onPress = (0, _interaction.getInteractionHandler)(state.ruleEffectGetter, "onPress", inline?.onPress);
      result.onPressIn = (0, _interaction.getInteractionHandler)(state.ruleEffectGetter, "onPressIn", inline?.onPressIn);
      result.onPressOut = (0, _interaction.getInteractionHandler)(state.ruleEffectGetter, "onPressOut", inline?.onPressOut);
    }
    if (_reactivity.focusFamily.has(state.ruleEffectGetter)) {
      result ??= {};
      result.onBlur = (0, _interaction.getInteractionHandler)(state.ruleEffectGetter, "onBlur", inline?.onBlur);
      result.onFocus = (0, _interaction.getInteractionHandler)(state.ruleEffectGetter, "onFocus", inline?.onFocus);
    }
    if (_reactivity.containerLayoutFamily.has(state.ruleEffectGetter)) {
      result ??= {};
      result.onLayout = (0, _interaction.getInteractionHandler)(state.ruleEffectGetter, "onLayout", inline?.onLayout);
    }
  }
  return result;
}
function deepMergeConfig(config, left, right, rightIsInline = false) {
  if (!right) {
    return {
      ...left
    };
  }
  let result = config.target ? Object.assign({}, left, right) : {
    ...left
  };
  if (right && rightIsInline && config.source in right && config.target !== config.source) {
    delete result[config.source];
  }

  /**
   *  If target is a path, deep merge until we get to the last key
   */
  if (Array.isArray(config.target)) {
    for (let i = 0; i < config.target.length - 1; i++) {
      const key = config.target[i];
      if (key === undefined) {
        return result;
      }
      result[key] = deepMergeConfig({
        source: config.source,
        target: config.target.slice(i + 1)
      }, left?.[key], right?.[key], rightIsInline);
    }
    return result;
  }
  const target = config.target;
  if (target === undefined || target === false) {
    return result;
  }
  let rightValue = right?.[target];

  // Strip any inline variables from the target
  if (rightIsInline && rightValue) {
    if (Array.isArray(rightValue)) {
      rightValue = rightValue.filter(v => {
        return typeof v !== "object" || !(v && _reactivity.VAR_SYMBOL in v);
      });
      if (rightValue.length === 0) {
        rightValue = undefined;
      }
    } else if (typeof rightValue === "object" && rightValue && _reactivity.VAR_SYMBOL in rightValue) {
      rightValue = undefined;
      delete result[target][_reactivity.VAR_SYMBOL];
    }
  }
  if (rightValue !== undefined) {
    result[target] = left && target in left ? [left[target], rightValue] : rightValue;
  }
  return result;
}
function nativeStyleMapping(config, props) {
  if (!config.nativeStyleMapping || !props) {
    return props;
  }
  let source;
  if (typeof config.target === "string") {
    source = props[config.target];
  } else if (config.target === false) {
    source = props["style"];
  } else {
    const tokens = [...config.target];
    const lastToken = tokens.pop();
    source = props;
    for (const token of tokens) {
      source = source[token];
      if (!source) {
        return props;
      }
    }
    source = source[lastToken];
  }
  if (!source) {
    return props;
  }
  for (const [key, path] of Object.entries(config.nativeStyleMapping)) {
    const styleValue = source[key];
    delete source[key];
    if (styleValue === undefined) {
      continue;
    }
    let target = props;
    const tokens = path.split(".");
    const lastToken = tokens.pop();
    for (const token of tokens) {
      target[token] ??= {};
      target = target[token];
    }
    target[lastToken] = styleValue;
  }
  return props;
}
//# sourceMappingURL=index.js.map