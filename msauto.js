var csc;

var ct = 0;
var id;
var b_solve = document.getElementById("solve");
var c_lapse = document.getElementById("timelapse");
var deadend = false;
var quit = true;
var lapse;

function solve() {
    if (!quit) return;
    lapse = c_lapse.checked;
    if (gamestate == 0) opencell(h / 2, w / 2, false, true);
    if (lapse && id !== undefined) stopscan("Activate");
    deadend = false;
    quit = false;
    ct = 0;
    if (lapse) id = setInterval(scan_basic, 250);
    while (!quit && !lapse) {
        scan_basic();
    }
}

function stopscan(msg) {
    if (lapse) clearInterval(id);
    b_solve.innerHTML = msg;
    quit = true;
}

function scan_basic() {
    if (gamestate == 2) {
        stopscan("Complete");
        return;
    }
    if (check_deadend()) {

        if (deadend) {
            stopscan("DEAD END!");
            return;
        } else {
            scan_include();
            deadend = true;
            return;
        }
        /*
        // for debug
        stopscan(true);
        return;
        */
    } else deadend = false;

    ct++;
    b_solve.innerText = ct;

    csc = deepcopy(csarr);
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            var ce = csarr[i][j];
            if (ce.state != 3) continue;
            var nfval = 0;
            var fval = 0;
            for (var k = 0; k < 8; k++) {
                var c = i + DX[k],
                    r = j + DY[k];
                if (cond(0, c, h, 0, r, w)) {
                    if (csarr[c][r].state == 0) nfval++;
                    else if (csarr[c][r].state == 1) fval++;

                }
            }
            //cells[i][j].innerText=csarr[i][j].val+","+nfval+","+fval;
            var safe = fval == ce.val;
            var flgd = (fval + nfval) == ce.val;
            for (var k = 0; k < 8; k++) {
                var c = i + DX[k],
                    r = j + DY[k];
                if (cond(0, c, h, 0, r, w)) {
                    var s = csarr[c][r].state;
                    if (s == 0) safe ? opencell(c, r, false, true) : (flgd ? flag(c, r, 1) : null);
                }


            }
        }
    }
}

function scan_include() {
    csc = deepcopy(csarr);
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            var ce = csarr[i][j];
            if (ce.state != 3) continue;
            var set = new CellSet(i, j);
            var vval = csarr[i][j].val;
            for (var k = 0; k < 8; k++) {
                var c = i + DX[k],
                    r = j + DY[k];
                if (cond(0, c, h, 0, r, w)) {
                    var cst = csarr[c][r].state;
                    if (cst == 0) set.push(c * w + r);
                    else if (cst == 1) vval--;
                }
            }
            set.vmval = vval;

            var arset = [];
            var d = [-2, -1, 0, 1, 2];
            for (var x = 0; x < 5; x++) {
                for (var y = 0; y < 5; y++) {
                    var c = i + d[x],
                        r = j + d[y];
                    if (x == 2 && y == 2) continue; //self comparation
                    if (cond(0, c, h, 0, r, w) && csarr[c][r].state == 3) arset.push(makeset(c, r));
                }
            }
            for (var s in arset) {
                var sa = arset[s];
                if (include(set, sa)) {
                    var setd = diff(set, sa);
                    //console.log(set);
                    //console.log(sa);
                    //console.log(setd);
                    //console.log("---");
                    if (setd.vmval == 0) {
                        for (var k in setd.set) {
                            var coord = cnv(setd.set[k]);
                            opencell(coord[0], coord[1], false, true);
                        }
                    } else if (setd.vmval == setd.size()) {
                        for (var k in setd.set) {
                            var coord = cnv(setd.set[k]);
                            flag(coord[0], coord[1], 1);
                        }
                    }

                } else {
                    var setc = comm(set, sa);
                    var setd = diff(set, sa);
                    var minm = Math.max(0, sa.vmval - (sa.size() - setc.size())); //minimum number of mines which setc contains
                    var maxm = Math.min(setc.size(), sa.vmval);

                    if (minm == set.vmval) { //setd no longer contains any mines.
                        for (var k in setd.set) {
                            var coord = cnv(setd.set[k]);
                            opencell(coord[0], coord[1], false, true);
                        }
                    } else if ((set.vmval - maxm) == setd.size()) {
                        for (var k in setd.set) {
                            var coord = cnv(setd.set[k]);
                            flag(coord[0], coord[1], 1);
                        }
                    }
                }
            }

        }
    }
}
/**
 * Make a set of not-opened cells around the cell.
 *
 * @params int c, r: column, row index of the center cell.
 * @return CellSet
 */
function makeset(c, r) {
    var set = new CellSet(c, r);
    var vval = csarr[c][r].val;
    for (var k = 0; k < 8; k++) {
        var i = c + DX[k],
            j = r + DY[k];
        if (cond(0, i, h, 0, j, w)) {
            if (csarr[i][j].state == 0) set.push(i * w + j);
            else if (csarr[i][j].state == 1) vval--;
        }
    }
    set.vmval = vval;
    return set;
}

function check_deadend() {
    if (csc === undefined) return false;
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            if (csc[i][j].state != csarr[i][j].state) return false;
        }
    }
    return true;
}
/**
 * Returns whether a set se includes the other set ot (ot ⊂ se).
 * Note that this returns false if at least one of se and ot is Empty.
 *
 * @params CellSet se, ot: set of integers. each integer represents a coordinate of a cell.
 * @return true if se includes ot, where both se and ot are not Empty
 */
function include(se, ot) {
    if (se.isEmpty() || ot.isEmpty()) return false;
    for (var i in ot.set) {
        if (se.set.indexOf(ot.set[i]) == -1) return false;
    }
    return true;
}
/**
 * Returns set difference of se and ot: se - ot.
 * Note that property center will be inherited from se.
 *
 * @params CellSet se, ot: set of integers. each integer represents a coordinate of a cell.
 * @return CellSet whose set and vmval is (se - ot).
 */
function diff(se, ot) {
    var sd = se.copy();
    for (var i in ot.set) {
        var index = sd.set.indexOf(ot.set[i])
        if (index == -1) continue;
        sd.remove(index);
    }
    sd.vmval -= ot.vmval;
    return sd;
}
/**
 * Returns common set of se and ot: se ∧ ot.
 * Note that property center, vmval will be inherited from se.
 *
 * @params CellSet se, ot: set of integers. each integer represents a coordinate of a cell.
 * @return CellSet whose set is (se ∧ ot).
 */
function comm(se, ot) {
    var sc = new CellSet(se.c(), se.r());
    sc.vmval = se.vmval;
    for (var i in ot.set) {
        if (se.set.indexOf(ot.set[i]) != -1) sc.push(ot.set[i]);
    }
    return sc;
}

function deepcopy(a) {
    if (a instanceof Array) {
        var l = a.length;
        var n = Array(l);
        for (var i = 0; i < l; i++) {
            n[i] = deepcopy(a[i]);
        }
        return n;
    } else {
        return Object.assign({}, a);
    }
}
