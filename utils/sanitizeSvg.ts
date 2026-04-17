import DOMPurify from 'isomorphic-dompurify'

const SVG_ALLOWED_TAGS = [
  'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'ellipse', 'g', 'defs', 'clipPath', 'mask', 'use', 'symbol',
  'linearGradient', 'radialGradient', 'stop', 'filter', 'pattern',
  'feGaussianBlur', 'feOffset', 'feMerge', 'feMergeNode',
  'feColorMatrix', 'feBlend', 'feComposite', 'feFlood', 'feTurbulence',
  'feDisplacementMap', 'feImage', 'feTile', 'feConvolveMatrix',
  'feDiffuseLighting', 'feSpecularLighting', 'fePointLight', 'feSpotLight',
  'feDistantLight', 'feMorphology', 'feDropShadow',
  'text', 'tspan', 'textPath', 'animate', 'animateTransform',
  'title', 'desc', 'metadata', 'image', 'switch', 'foreignObject'
]

const SVG_ALLOWED_ATTR = [
  'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
  'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'opacity',
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'width', 'height', 'transform', 'class', 'id', 'clip-path', 'mask',
  'points', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits',
  'gradientTransform', 'spreadMethod', 'fx', 'fy', 'font-size',
  'font-family', 'font-weight', 'text-anchor', 'dominant-baseline',
  'letter-spacing', 'fill-opacity', 'fill-rule', 'clip-rule',
  'color', 'display', 'overflow', 'visibility',
  'xlink:href', 'href', 'preserveAspectRatio',
  'dur', 'repeatCount', 'values', 'keyTimes', 'keySplines',
  'attributeName', 'from', 'to', 'begin', 'type', 'result',
  'in', 'in2', 'stdDeviation', 'dx', 'dy', 'mode',
  'flood-color', 'flood-opacity', 'operator', 'k1', 'k2', 'k3', 'k4',
  'patternUnits', 'patternTransform', 'patternContentUnits',
  'filterUnits', 'primitiveUnits', 'color-interpolation-filters',
  'baseFrequency', 'numOctaves', 'seed', 'stitchTiles',
  'scale', 'xChannelSelector', 'yChannelSelector',
  'lighting-color', 'surfaceScale', 'specularConstant', 'specularExponent',
  'azimuth', 'elevation', 'kernelMatrix', 'divisor', 'bias',
  'targetX', 'targetY', 'edgeMode', 'radius', 'numOctaves',
  'stroke-opacity', 'vector-effect', 'shape-rendering',
  'image-rendering', 'color-rendering', 'marker-start', 'marker-mid', 'marker-end'
]

export function sanitizeSvg(dirty: string | null | undefined): string {
  if (!dirty) return ''

  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: SVG_ALLOWED_TAGS,
    ALLOWED_ATTR: SVG_ALLOWED_ATTR,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'a'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
  })
}
