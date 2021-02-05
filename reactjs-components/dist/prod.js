'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var styled = _interopDefault(require('styled-components'));

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _taggedTemplateLiteral(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }

  return Object.freeze(Object.defineProperties(strings, {
    raw: {
      value: Object.freeze(raw)
    }
  }));
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["\n\tpadding: 0px;\n\tmargin: 0px;\n\tfont-family: 'Muli';\n\tfont-size: 16px;\n\t", "\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}
var P = styled.p(_templateObject(), function (props) {
  return props.style;
});

var Text = function Text(props) {
  return /*#__PURE__*/React__default.createElement(P, {
    style: props.style
  }, props.children);
};

var Color = {
  main: '#003d68',
  secondary: '#0090b0',
  lineColor: '#e2e0d4'
};

function _templateObject$1() {
  var data = _taggedTemplateLiteral(["\n    padding: 16px;\n    color: white;\n    background-color: ", ";\n    cursor: ", ";\n    border: none;\n    height: 56px;\n    border-radius: 4px;\n    opacity: ", ";\n    outline: none;\n\n    :hover{\n        background-color: ", ";\n    }\n\n    ", ";\n"]);

  _templateObject$1 = function _templateObject() {
    return data;
  };

  return data;
}
var Container = styled.button(_templateObject$1(), Color.main, function (props) {
  return !props.disabled && 'pointer';
}, function (props) {
  return props.disabled ? 0.5 : 1.0;
}, function (props) {
  return !props.disabled && Color.secondary;
}, function (props) {
  return props.style;
});

var Button = function Button(props) {
  return /*#__PURE__*/React__default.createElement(Container, props, /*#__PURE__*/React__default.createElement(Text, null, props.text));
};

function _templateObject2() {
  var data = _taggedTemplateLiteral(["\n    height: 24px;\n    width: 24px;\n"]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject$2() {
  var data = _taggedTemplateLiteral(["\n    display: inline-flex;\n    padding: 8px;\n    border-radius: 4px;\n    cursor: ", ";\n    flex-direction: column;\n    align-items: center;\n    opacity: ", ";\n\n    :hover{\n        background-color: ", "\n    }\n"]);

  _templateObject$2 = function _templateObject() {
    return data;
  };

  return data;
}
var Container$1 = styled.div(_templateObject$2(), function (props) {
  return !props.disabled && 'pointer';
}, function (props) {
  return props.disabled ? 0.5 : 1.0;
}, function (props) {
  return !props.disabled && Color.secondary;
});
var Icon = styled.img(_templateObject2());

var ButtonImage = function ButtonImage(props) {
  var onButtonClick = function onButtonClick() {
    if (!props.disabled) props.onClick && props.onClick();
  };

  return /*#__PURE__*/React__default.createElement(Container$1, _extends({}, props, {
    onClick: onButtonClick
  }), /*#__PURE__*/React__default.createElement(Icon, {
    src: props.src
  }), props.text && /*#__PURE__*/React__default.createElement(Text, {
    style: {
      marginTop: 2,
      fontSize: 14
    }
  }, props.text));
};

function _templateObject3() {
  var data = _taggedTemplateLiteral(["\n    position: absolute;\n    top: -8px;\n    left: 8px;\n    padding: 0px 2px;\n    background-color: white;\n"]);

  _templateObject3 = function _templateObject3() {
    return data;
  };

  return data;
}

function _templateObject2$1() {
  var data = _taggedTemplateLiteral(["\n    display: flex;\n    flex: 1;\n    border: none;\n    height: 48px;\n    margin-top: 12px;\n    font-family: 'Muli';\n    font-size: 18px;\n    padding: 0px 10px;\n    border-radius: 4px;\n    outline: none;\n"]);

  _templateObject2$1 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject$3() {
  var data = _taggedTemplateLiteral(["\n    position: relative;\n    display: flex;\n    flex-direction: column;\n    border: ", ";\n    border-radius: 4px;\n    padding-bottom: 8px;\n"]);

  _templateObject$3 = function _templateObject() {
    return data;
  };

  return data;
}
var Container$2 = styled.div(_templateObject$3(), function (props) {
  return props.isFocus ? '2px solid ' + Color.secondary : '1px solid ' + Color.lineColor;
});
var InputStyled = styled.input(_templateObject2$1());
var PlaceholderView = styled.div(_templateObject3());

var Input = function Input(props) {
  var _useState = React.useState(undefined),
      _useState2 = _slicedToArray(_useState, 2),
      value = _useState2[0],
      setValue = _useState2[1];

  var _useState3 = React.useState(false),
      _useState4 = _slicedToArray(_useState3, 2),
      isFocus = _useState4[0],
      setIsFocus = _useState4[1];

  var style = props.style,
      inputProps = _objectWithoutProperties(props, ["style"]);

  var onInputChange = function onInputChange(e) {
    setValue(e.target.value);
    inputProps.onChange && inputProps.onChange(e);
  };

  var onInputFocus = function onInputFocus() {
    setIsFocus(true);
    inputProps.onFocus && inputProps.onFocus();
  };

  var onInputBlur = function onInputBlur() {
    setIsFocus(false);
    inputProps.onBlur && inputProps.onBlur();
  };

  return /*#__PURE__*/React__default.createElement(Container$2, {
    style: style,
    isFocus: isFocus
  }, inputProps.placeholder && value && /*#__PURE__*/React__default.createElement(PlaceholderView, null, /*#__PURE__*/React__default.createElement(Text, {
    style: {
      fontSize: 14
    }
  }, inputProps.placeholder)), /*#__PURE__*/React__default.createElement(InputStyled, _extends({}, inputProps, {
    onFocus: onInputFocus,
    onBlur: onInputBlur,
    onChange: onInputChange
  })));
};

exports.Button = Button;
exports.ButtonImage = ButtonImage;
exports.Color = Color;
exports.Input = Input;
exports.Text = Text;
