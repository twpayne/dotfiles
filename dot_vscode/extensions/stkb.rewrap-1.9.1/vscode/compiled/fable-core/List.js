"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ofArray = undefined;
exports.append = append;
exports.choose = choose;
exports.collect = collect;
exports.concat = concat;
exports.filter = filter;
exports.where = where;
exports.initialize = initialize;
exports.map = map;
exports.mapIndexed = mapIndexed;
exports.indexed = indexed;
exports.partition = partition;
exports.replicate = replicate;
exports.reverse = reverse;
exports.singleton = singleton;
exports.slice = slice;
exports.unzip = unzip;
exports.unzip3 = unzip3;
exports.groupBy = groupBy;
exports.splitAt = splitAt;
exports.head = head;
exports.tail = tail;

var _ListClass = require("./ListClass");

var _ListClass2 = _interopRequireDefault(_ListClass);

var _Map = require("./Map");

var _Option = require("./Option");

var _Seq = require("./Seq");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _ListClass2.default;
exports.ofArray = _ListClass.ofArray;
function append(xs, ys) {
  return (0, _Seq.fold)((acc, x) => new _ListClass2.default(x, acc), ys, reverse(xs));
}
function choose(f, xs) {
  const r = (0, _Seq.fold)((acc, x) => {
    const y = f(x);
    return y != null ? new _ListClass2.default((0, _Option.getValue)(y), acc) : acc;
  }, new _ListClass2.default(), xs);
  return reverse(r);
}
function collect(f, xs) {
  return (0, _Seq.fold)((acc, x) => append(acc, f(x)), new _ListClass2.default(), xs);
}
// TODO: should be xs: Iterable<List<T>>
function concat(xs) {
  return collect(x => x, xs);
}
function filter(f, xs) {
  return reverse((0, _Seq.fold)((acc, x) => f(x) ? new _ListClass2.default(x, acc) : acc, new _ListClass2.default(), xs));
}
function where(f, xs) {
  return filter(f, xs);
}
function initialize(n, f) {
  if (n < 0) {
    throw new Error("List length must be non-negative");
  }
  let xs = new _ListClass2.default();
  for (let i = 1; i <= n; i++) {
    xs = new _ListClass2.default(f(n - i), xs);
  }
  return xs;
}
function map(f, xs) {
  return reverse((0, _Seq.fold)((acc, x) => new _ListClass2.default(f(x), acc), new _ListClass2.default(), xs));
}
function mapIndexed(f, xs) {
  return reverse((0, _Seq.fold)((acc, x, i) => new _ListClass2.default(f(i, x), acc), new _ListClass2.default(), xs));
}
function indexed(xs) {
  return mapIndexed((i, x) => [i, x], xs);
}
function partition(f, xs) {
  return (0, _Seq.fold)((acc, x) => {
    const lacc = acc[0];
    const racc = acc[1];
    return f(x) ? [new _ListClass2.default(x, lacc), racc] : [lacc, new _ListClass2.default(x, racc)];
  }, [new _ListClass2.default(), new _ListClass2.default()], reverse(xs));
}
function replicate(n, x) {
  return initialize(n, () => x);
}
function reverse(xs) {
  return (0, _Seq.fold)((acc, x) => new _ListClass2.default(x, acc), new _ListClass2.default(), xs);
}
function singleton(x) {
  return new _ListClass2.default(x, new _ListClass2.default());
}
function slice(lower, upper, xs) {
  const noLower = lower == null;
  const noUpper = upper == null;
  return reverse((0, _Seq.fold)((acc, x, i) => (noLower || lower <= i) && (noUpper || i <= upper) ? new _ListClass2.default(x, acc) : acc, new _ListClass2.default(), xs));
}
/* ToDo: instance unzip() */
function unzip(xs) {
  return (0, _Seq.foldBack)((xy, acc) => [new _ListClass2.default(xy[0], acc[0]), new _ListClass2.default(xy[1], acc[1])], xs, [new _ListClass2.default(), new _ListClass2.default()]);
}
/* ToDo: instance unzip3() */
function unzip3(xs) {
  return (0, _Seq.foldBack)((xyz, acc) => [new _ListClass2.default(xyz[0], acc[0]), new _ListClass2.default(xyz[1], acc[1]), new _ListClass2.default(xyz[2], acc[2])], xs, [new _ListClass2.default(), new _ListClass2.default(), new _ListClass2.default()]);
}
function groupBy(f, xs) {
  return (0, _Seq.toList)((0, _Seq.map)(k => [k[0], (0, _Seq.toList)(k[1])], (0, _Map.groupBy)(f, xs)));
}
function splitAt(index, xs) {
  if (index < 0) {
    throw new Error("The input must be non-negative.");
  }
  let i = 0;
  let last = xs;
  const first = new Array(index);
  while (i < index) {
    if (last.tail == null) {
      throw new Error("The input sequence has an insufficient number of elements.");
    }
    first[i] = last.head;
    last = last.tail;
    i++;
  }
  return [(0, _ListClass.ofArray)(first), last];
}
function head(xs) {
  if (xs.head !== undefined) {
    return xs.head;
  } else {
    throw new Error("The input list was empty.");
  }
}
function tail(xs) {
  if (xs.tail !== undefined) {
    return xs.tail;
  } else {
    throw new Error("The input list was empty.");
  }
}