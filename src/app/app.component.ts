import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';

interface Vector {
  x: number;
  y: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;

  sampleSize: number = 5;
  intervalMs: number = 50;
  possibilities: number = this.factorialize(this.sampleSize);
  timeEstimate: string = this.MsToTimeString(this.intervalMs * this.possibilities);
  distance: number = 0;
  recordDistance: number = Infinity;
  currentBestOrder: number[];
  counter: number = 0;

  private points: Vector[];
  private interval: number;

  ngAfterViewInit(): void {
    if (!this.canvas?.nativeElement) return;

    this.newPoints();
    this.solveRandom();
  }

  onSampleSizeChange(): void {
    this.possibilities = this.factorialize(this.sampleSize);
    this.timeEstimate = this.MsToTimeString(this.intervalMs * this.possibilities);
  }

  onIntervalChange(): void {
    this.timeEstimate = this.MsToTimeString(this.intervalMs * this.possibilities);
  }

  newPoints(): void {
    this.stop();
    this.clearStats();
    this.points = this.randomPoints();
    this.clearCanvas();
    this.drawPoints(this.points);
  }

  solveRandom(): void {
    this.stop();
    this.clearStats();
    const points = [...this.points];

    this.interval = setInterval(() => {
      this.distance = points.reduce((sum, point, i) => {
        return i > 0 ? sum + this.calcDistance(point, points[i - 1]) : 0;
      }, 0);
      if (this.distance < this.recordDistance) {
        this.recordDistance = this.distance;
        this.currentBestOrder = [...points.map(point => this.points.indexOf(point))];
      }
      this.counter++;

      this.clearCanvas();
      this.drawPoints(points);
      this.drawLines(this.currentBestOrder.map(i => this.points[i]), true);
      this.drawLines(points);

      this.arraySwap(points, this.randomInt(points.length), this.randomInt(points.length))
    }, this.intervalMs);
  }

  solveLexicographic(): void {
    this.stop();
    this.clearStats();
    let order = this.points.map((_, i) => i);

    this.interval = setInterval(() => {
      const points = order.map(i => this.points[i]);

      this.distance = points.reduce((sum, point, i) => {
        return i > 0 ? sum + this.calcDistance(point, points[i - 1]) : 0;
      }, 0);

      if (this.distance < this.recordDistance) {
        this.recordDistance = this.distance;
        this.currentBestOrder = [...order];
      }
      this.counter++;

      this.clearCanvas();
      this.drawPoints(points);
      this.drawLines(this.currentBestOrder.map(i => this.points[i]), true);
      this.drawLines(points);

      let xMax = -1;
      for (let x = 0; x < order.length - 1; x++) {
        if (order[x] < order[x + 1]) {
          xMax = x;
        }
      }

      if (xMax === -1) {
        this.stop();
      }

      let yMax = -1;
      for (let y = 0; y < order.length; y++) {
        if (order[y] > order[xMax]) {
          yMax = y;
        }
      }

      this.arraySwap(order, xMax, yMax);

      order = order.concat(order.splice(xMax + 1).reverse());
    }, this.intervalMs);
  }

  stop(): void {
    clearInterval(this.interval);
  }

  private getDrawingContext(): CanvasRenderingContext2D | null {
    return this.canvas?.nativeElement?.getContext('2d') || null;
  }

  private clearCanvas(): void {
    const ctx = this.getDrawingContext();
    if (!ctx) return;
    ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }

  private drawPoint(pos: Vector, bold: boolean = false): void {
    const ctx = this.getDrawingContext();
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
    ctx.lineWidth = bold ? 2 : 1;
    ctx.strokeStyle = bold ? '#fff' : '#ccc';
    ctx.stroke();
  }

  private drawLine(pos1: Vector, pos2: Vector, bold: boolean = false): void {
    const ctx = this.getDrawingContext();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos1.x, pos1.y);
    ctx.lineTo(pos2.x, pos2.y);
    ctx.lineWidth = bold ? 10 : 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = bold ? '#00b' : '#999';
    ctx.stroke();
  }

  private drawPoints(points: Vector[]): void {
    points.forEach((point, i) => this.drawPoint(point, i === 0 || i === points.length - 1));
  }

  private drawLines(points: Vector[], bold: boolean = false): void {
    for (let i = 1; i < points.length; i++) {
      this.drawLine(points[i - 1], points[i], bold);
    }
  }

  private randomInt(max: number = 1): number {
    return Math.floor(Math.random() * max);
  }

  private randomPoints(): Vector[] {
    return Array(this.sampleSize).fill(0).map(_ => ({
      x: this.randomInt(this.canvas.nativeElement.width),
      y: this.randomInt(this.canvas.nativeElement.height)
    }));
  }

  private calcDistance(pos1: Vector, pos2: Vector): number {
    const a = pos1.x - pos2.x;
    const b = pos1.y - pos2.y;
    return Math.sqrt(a * a + b * b);
  }

  private arraySwap(array: any[], index1: number, index2: number) {
    const temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
  }

  private factorialize(number: number) {
    if (number === 0 || number === 1)
      return 1;
    for (let i = number - 1; i >= 1; i--) {
      number *= i;
    }
    return number;
  }

  private MsToTimeString(s: number): string {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;

    return `${hrs}:${mins}:${secs}.${ms}`;
  }

  private clearStats(): void {
    this.distance = 0;
    this.recordDistance = Infinity;
    this.counter = 0;
  }
}
