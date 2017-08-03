const FluidDynamicsSolver = require('./lib/fds')

const N_ = 30 // sim complexity...?
const solver = new FluidDynamicsSolver(N_)
solver.initFDS()

const grid_width  = N_;
const grid_height = N_;

const canvas = document.createElement('canvas')
const RESOLUTION = 512
// canvas.style.width = '100vw'
// canvas.style.height = '100vh'
canvas.setAttribute('width', RESOLUTION)
canvas.setAttribute('height', RESOLUTION)
// canvas.style.margin = '10px'
canvas.style.background = 'yellow'
document.body.appendChild(canvas)
const canvasContext = canvas.getContext('2d')

// NOTE copy the canvas element and it's context
// used for double buffering
const canvasCopy = document.createElement('canvas')
canvasCopy.width = grid_width;
canvasCopy.height = grid_height;
const canvasCopyContext = canvasCopy.getContext('2d');
const canvasCopyImageData = canvasCopyContext.createImageData(grid_width, grid_height);


// interaction
const E_POINTER_MOVE = ('ontouchstart' in window) ? 'touchmove' : 'mousemove'
const INV_CANVAS_W = 1 / RESOLUTION
const INV_CANVAS_H = 1 / RESOLUTION
console.log(canvas)

let prevX = 0
let prevY = 0
canvas.addEventListener(E_POINTER_MOVE, (e) => {
  e.preventDefault()
  if (E_POINTER_MOVE === 'touchmove') {
    e = e.changedTouches[0];
    e.offsetX = e.pageX - e.target.offsetLeft;
    e.offsetY = e.pageY - e.target.offsetTop;
  }
  const _x = e.offsetX
  const _y = e.offsetY
  // normalize x and y
  const x = _x * INV_CANVAS_W
  const y = _y * INV_CANVAS_H
  // calculate dx and dy: normalized direction of mouse movement
  const dx = (_x - prevX) * INV_CANVAS_W;
  const dy = (_y - prevY) * INV_CANVAS_H;

  addSource(x, y, dx, dy)

  // record x and y for next calculation of dx and dy
  prevX = _x
  prevY = _y
})
function addSource(x, y, dx, dy) {
  const movement = dx * dx + dy * dy
  if (movement === 0) return
  const clampX = clamp(x, 0, 1)
  const clampY = clamp(y, 0, 1)
  const index = solver.NORM_IX(clampX, clampY)
  // TODO refactor fds.js, so that this part doesn't rely on global variables in there
  solver.record(clampX, clampY, dx, dy)
}
function clamp(input, min, max) {
  if (input < min) return min
  else if (input > max) return max
  else return input
}

function draw()
{
  // update fluid solver
  solver.update();
  // draw density to canvas element
  drawDensity();
  
  // loop
  window.requestAnimationFrame(draw)
}
// draw fluid in the canvas element
function drawDensity()
{
  var img_data_i;
  var dens_index;
  
  // i: column, j: row
  for(var j = 1; j < (N_ + 1); j++)
  {
    for(var i = 1; i < (N_ + 1); i++)
    {
      // in case you need to know what that is:
      // https://developer.mozilla.org/En/HTML/Canvas/Pixel_manipulation_with_canvas
      img_data_i = ((j - 1) * N_ * 4) + ((i - 1) * 4);
      dens_index = solver.REG_IX(i, j);
      const dens = solver.getDens(dens_index)
      // write color to canvas
      canvasCopyImageData.data[img_data_i]     = dens;
      canvasCopyImageData.data[img_data_i + 1] = dens;
      canvasCopyImageData.data[img_data_i + 2] = dens;
      canvasCopyImageData.data[img_data_i + 3] = 255; 
    }
  }
  
  // write new data back to the copy
  canvasCopyContext.putImageData(canvasCopyImageData, 0, 0);
  // draw image on screen using the canvas copy
  canvasContext.drawImage(canvasCopy, 0, 0, RESOLUTION, RESOLUTION);
}

draw()