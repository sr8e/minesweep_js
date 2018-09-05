/****** Define Cell ******/
class CellSubstance {
    constructor() {
        this.val = 0;
        this.state = 0; // NF:0 Flg:1 Q:2 Op:3
        this.mine = false;
    }
}
class CellSet {
    constructor(c, r) {
        this.set = [];
        //this.pset=[];
        this.vmval = 0;
        this.center = [c, r];
    }
    c() {
        return this.center[0];
    }
    r() {
        return this.center[1];
    }
    push(v) {
        this.set.push(v);
        //this.parse();
    }
    remove(p) {
        this.set.splice(p, 1);
        //this.parse();
    }
    /*
    parse(){
        this.pset=[];
        for(var k in this.set){
            this.pset.push(cnv(this.set[k]));
        }
    }
    */
    isEmpty() {
        return this.set.length == 0;
    }
    size() {
        return this.set.length;
    }
    copy() {
        var ccs = new CellSet(this.c(), this.r());
        ccs.set = Object.assign([], this.set);
        ccs.vmval = this.vmval;
        return ccs;
    }
}

const DX = [-1, 0, 1, -1, 1, -1, 0, 1];
const DY = [-1, -1, -1, 0, 0, 1, 1, 1];

/****** option ******/
var h = 16;
var w = 16;
var m = 40;

function set(ht, wt, mt) {
    w = wt, h = ht, m = mt;
    init();
    formatCellArray();
}

/****** global variables ******/
var gamestate = 0; //waiting:0 playing:1 end:2
var time_s;
var time_prec;
var timer;
var cells;
var _3bv;
var lcc; //left click(virtual) count

/****** Initialize ******/
document.addEventListener("mouseup", onup);

var con = document.getElementById("cellcontainer");
var rem = document.getElementById("mine"); //rest of mine
var elt = document.getElementById("time"); //ellapsed time
var s3bv = document.getElementById("s3bv");
var slcc = document.getElementById("lcc");
init();
formatCellArray();

function init() {
    cells = [];
    while (con.firstChild)
        con.removeChild(con.firstChild);
    var colarr = [];
    for (var i = 0; i < h; i++) {
        var e = document.createElement("div");
        e.setAttribute("class", "col");
        colarr.push(e);
        con.appendChild(e);
    }
    //row
    for (var i in colarr) {
        row = [];
        for (var j = 0; j < w; j++) {
            var e = document.createElement("div");
            e.setAttribute("class", "cell");
            e.setAttribute("id", i + "/" + j);
            e.addEventListener("mousedown", ondown);
            e.addEventListener("click", onclick);
            row.push(e);
            colarr[i].appendChild(e);
        }
        cells.push(row);
    }
}

function formatCellArray() {
    _3bv = 0, lcc = 0;
    csarr = new Array(h);
    for (var i = 0; i < h; i++) {
        csarr[i] = new Array(w);
        for (var j = 0; j < w; j++) {
            csarr[i][j] = new CellSubstance();
            cells[i][j].setAttribute("class", "cell");
            cells[i][j].innerHTML = "";
        }
    }
    gamestate = 0;
    changebutton(0);
    countstop();
    rem.innerHTML = formatstr(m, 3, 0);
    elt.innerHTML = formatstr(0, 3, 3);
    s3bv.innerHTML = formatstr(0, 3, 0);
    slcc.innerHTML = formatstr(0, 3, 0);
    document.getElementById("solve").innerHTML = "Solver";
}

//for debugging
function retry() {
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            csarr[i][j].state = 0;
            cells[i][j].setAttribute("class", "cell");
        }
    }
    countstop();
    gamestate = 1;
    lcc = 0;
}

/****** Define EventFunction ******/
function ondown(e) {
    if (gamestate == 2) return;
    var id = e.currentTarget.id.split("/");
    var c = parseInt(id[0]),
        r = parseInt(id[1]);
    var cell = csarr[c][r];
    if (e.button == 0) {
        if (cell.state == 0)
            e.currentTarget.setAttribute("class", "cell down");

    } else if (e.button == 2) {
        if (cell.state == 0) {
            cell.state = 1;
            //console.log("change state to Flg");
            flag(c, r, 1);
        } else if (cell.state == 1 || cell.state == 2) {
            cell.state = 0;
            //console.log("change state to NF");
            flag(c, r, 0);
        }
    }
}

function onclick(e) {
    if (gamestate == 2) return;
    var id = e.currentTarget.id.split("/");
    var c = parseInt(id[0]),
        r = parseInt(id[1]);
    var cell = csarr[c][r];
    if (e.button == 0) {
        if (cell.state == 0) {
            //console.log("open cell");
            opencell(c, r, false, true);
        } else if (cell.state == 1) {
            cell.state = 2;
            //console.log("change state to Q");
            flag(c, r, 2);
        } else if (cell.state == 2) {
            cell.state = 1;
            //console.log("change state to Flg");
            flag(c, r, 1);
        } else if (cell.state == 3) {
            //console.log("open around");
            opencell(c, r, true, false);
        }
    }
}

function onup(e) {
    if (gamestate == 2) return;
    var cl = document.getElementsByClassName("down");
    var l = cl.length;
    for (var i = 0; i < l; i++) {
        cl.item(0).setAttribute("class", "cell");
    }
}

/****** display ******/
function changebutton(clear) {
    var b = document.getElementById("mainbutton");
    if (clear == 0) { // normal
        b.innerHTML = "( ◠‿◠ )";
    } else if (clear == 1) { //clear
        b.innerHTML = "(՞ةڼ◔)";
    } else if (clear == -1) { //fail
        b.innerHTML = "(◞‸◟)";
    }

}

function showup() {
    if (gamestate == 0) return;
    if (gamestate == 1) {
        countstop();
        gamestate = 2;
    }
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            var cs = csarr[i][j];
            var cell = cells[i][j];
            cell.setAttribute("class", cs.edge ? "cell flat c_edge" : cs.reach ? "cell flat c_emp" : cs.ne ? "cell flat c_ne" : "cell flat");
            switch (cs.state) {
                case 0: //NF
                case 2: //Q
                    cell.innerHTML = cs.val == 0 ? "" : "<img class='stimg' src='./img/" + (cs.mine ? "mine" : cs.val) + ".png'>";
                    break;
                case 1: //Flg
                    cell.innerHTML = "<img class='stimg' src='./img/" + (cs.mine ? "mine" : "wrong") + ".png'>";
                    break;
            }
        }
    }
}

function countstart() {
    timer = setInterval(countup, 57);
    time_s = new Date().getTime();
}

function countup() {
    var t = new Date().getTime()
    elt.innerHTML = formatstr((t - time_s) / 1000, 3, 3);
}

function countstop() {
    try {
        clearInterval(timer);
        time_prec = new Date().getTime() - time_s;
        elt.innerHTML = formatstr(time_prec / 1000, 3, 3);
    } catch {
        void(0);
    }
}

function formatstr(v, f, l) {
    var n = Number(v);
    if (isNaN(n)) n = 0;
    var s = n.toString().split(".");
    var int = s[0],
        flt = s.length == 2 ? s[1] : "";
    var il = int.length,
        fl = flt.length;
    if (il < f)
        for (var i = 0; i < f - il; i++) int = "0" + int;
    if (fl < l)
        for (var j = 0; j < l - fl; j++) flt += "0";
    int = int.slice(-f);
    flt = flt.slice(0, l);
    return int + (flt.length > 0 ? "." + flt : "");


}
/**
 * Returns (aunder <= a < aupper) && (bunder <= b < bupper).
 */
function cond(aunder, a, aupper, bunder, b, bupper) {
    var c = aunder <= a && a < aupper && bunder <= b && b < bupper;
    return c;
}
/****** control ******/

/**
 * Places mines on clicking at first.
 *
 * @params int c: first-click column index
 * @params int r: first-click row index
 * @params int m: number of mines to be placed
 */
function placemine(c, r, m) {
    const nmr = 3;
    var nma = 2 * nmr * nmr + 2 * nmr + 1;
    if (m > w * h - nma || m <= 0) {
        alert("Invalid Number!");
        return;
    }
    var invert = false;
    if (m > (w * h - nma) / 2) {
        invert = true;
        m = w * h - nma - m;

    }

    //to prevent dead end
    const dr = 0.75;
    var bc = Math.max(w - 6, 0) * Math.max(h - 6, 0);
    var bp = w * h - bc;
    var mc = Math.round(bc * m / (bc + bp * dr));
    var mp = m - mc;


    //generate unique m pairs of (c,r)
    //(c,r) corelates with c*w+r
    var co_c = [];
    var co_p = [];
    while (co_c.length != mc || co_p.length != mp) {
        var ran = parseInt(Math.random() * h * w);
        var ct = cnv(ran)[0],
            rt = cnv(ran)[1];
        if (Math.abs(ct - c) + Math.abs(rt - r) <= nmr) continue;
        var cen = cond(3, ct, h - 3, 3, rt, w - 3);
        if (cen && co_c.length != mc && co_c.indexOf(ran) == -1) //center
            co_c.push(ran);
        else if (!cen && co_p.length != mp && co_p.indexOf(ran) == -1)
            co_p.push(ran);
    }

    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            csarr[i][j].mine = ((cond(3, ct, h - 3, 3, rt, w - 3) ? co_c : co_p).indexOf(i * w + j) != -1) != invert;
            if (Math.abs(i - c) + Math.abs(j - r) <= nmr) csarr[i][j].mine = false;
        }
    }
    var mp = function (v) {
        var ct = cnv(v)[0],
            rt = cnv(v)[1];
        csarr[ct][rt].mine = !invert;
    }
    co_c.forEach(mp);
    co_p.forEach(mp);
    gamestate = 1;
    countstart();
}
/**
 * Converts value to coordinate vector.
 *
 * @params int v: a value which represents coordinate.
 */
function cnv(v) {
    return [parseInt(v / w), v % w];
}

function calcval() {
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            var val = 0;
            for (var k = 0; k < 8; k++) {
                var c = i + DX[k],
                    r = j + DY[k];
                if (cond(0, c, h, 0, r, w))
                    val += csarr[c][r].mine ? 1 : 0;

            }
            csarr[i][j].val = val;
            //debug! Do not erase
            //cells[i][j].innerHTML = csarr[i][j].mine ? "M" + val : val;
        }
    }
}

/**
 * Opens a cell.
 * 
 * @params int c: column index of the cell.
 * @params int r: row index of the cell.
 * @params bool ar: true if you clicked an already-opened cell to open around it.
 * @params bool count: false if the cell was next to an opened empty cell.
 */
function opencell(c, r, ar, count) {
    if (gamestate == 0) {
        placemine(c, r, m);
        calcval();
        calc3BV();
    }
    if (count) lcc++;
    var cell = cells[c][r];
    var cs = csarr[c][r];
    cs.state = 3;
    var arf = 0;
    if (ar) {
        for (var k = 0; k < 8; k++) {
            var i = c + DX[k],
                j = r + DY[k];
            if (cond(0, i, h, 0, j, w) && csarr[i][j].state == 1) {
                arf++;

            }
        }
    }
    if (cs.val == 0 || (ar && arf >= cs.val)) { //open around
        for (var k = 0; k < 8; k++) {
            var i = c + DX[k],
                j = r + DY[k];
            if (cond(0, i, h, 0, j, w) && csarr[i][j].state == 0) {
                opencell(i, j, false, ar);
            }

        }
    }
    cell.setAttribute("class", "cell flat");
    if (cs.mine) { //boom
        gamestate = 2;
        changebutton(-1);
        countstop();
        cs.state = 4;
        cell.innerHTML = "<img class='stimg' src='./img/boom.png'>";
    } else {
        var v = cs.val;
        if (v != 0) cell.innerHTML = "<img class='stimg' src='./img/" + v + ".png'>";
    }
    slcc.innerHTML = formatstr(lcc, 3, 0);
    if (check()) {
        gamestate = 2;
        changebutton(1);
        countstop();
    }
}

/**
 * Place a flag or a question-mark.
 * 
 * @params int c: column index of the cell.
 * @params int r: row index of the cell.
 * @params int ts: target state.
 */
function flag(c, r, ts) {
    var cell = cells[c][r];
    csarr[c][r].state = ts;
    switch (ts) {
        case 0: //NF
            cell.innerHTML = "";
            break;
        case 1: //Flg
            cell.innerHTML = "<img class='stimg' src='./img/Flg.png'>";
            break;
        case 2: //Q
            cell.innerHTML = "<img class='stimg' src='./img/Q.png'>";
    }
    check();
}

function check() {
    var nm = 0;
    var fn = 0;
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            switch (csarr[i][j].state) {
                case 1: //flg
                    fn++;
                    break;
                case 3: //op
                    nm++;
                    break;
            }
        }
    }
    rem.innerHTML = formatstr(Math.max(0, m - fn), 3, 0);
    return nm + m == h * w;
}

function calc3BV() {
    var nec = 0; //not empty or edge cell
    var ecg = 0; //empty and edge cell group
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            if (!csarr[i][j].mine && csarr[i][j].val > 0) {
                var edge = false;
                for (var k = 0; k < 8; k++) {
                    var c = i + DX[k],
                        r = j + DY[k];
                    if (cond(0, c, h, 0, r, w) && csarr[c][r].val == 0)
                        edge = true;

                }
                csarr[i][j].edge = edge;
            }
        }
    }
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            if (!csarr[i][j].edge && !csarr[i][j].mine && csarr[i][j].val > 0) {
                nec++;
                csarr[i][j].ne = true;
            } else if (csarr[i][j].val == 0 && csarr[i][j].reach === undefined) {
                var queue = [[i, j]];
                while (queue.length > 0) {
                    var coord = queue.shift();
                    var c = coord[0],
                        r = coord[1];
                    csarr[c][r].reach = true;
                    for (var k = 0; k < 8; k++) {
                        var ct = c + DX[k],
                            rt = r + DY[k];
                        if (cond(0, ct, h, 0, rt, w)) {
                            if (csarr[ct][rt].reach === undefined && csarr[ct][rt].val == 0) {
                                queue.push([ct, rt]);
                            }
                        }
                    }
                }
                ecg++;

            }
        }
    }
    _3bv = nec + ecg;
    document.getElementById("s3bv").innerText = formatstr(_3bv, 3, 0);
    //console.log(nec + "," + ecg);

}
