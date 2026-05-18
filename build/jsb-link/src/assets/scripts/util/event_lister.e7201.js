window.eventLister = function(n) {
var r = {};
n.on = function(n, e) {
r.hasOwnProperty(n) ? r[n].push(e) : r[n] = [ e ];
};
n.off = function(n, e) {
if (r.hasOwnProperty(n)) for (var t = r[n], o = t.length - 1; o >= 0; --o) if (t[o] === e) {
t.splice(o, 1);
break;
}
};
n.fire = function(n) {
if (r.hasOwnProperty(n)) for (var e = r[n], t = 0; t < e.length; ++t) {
for (var o = e[t], i = [], f = 1; f < arguments.length; ++f) i.push(arguments[f]);
o.apply(this, i);
}
};
n.removeLister = function(n) {
r[n] = [];
};
n.removeAllLister = function() {
r = {};
};
return n;
};