import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { NotFoundException } from '@zxing/library';
import { BrowserMultiFormatReader } from '@zxing/browser';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement')
  videoElement!: ElementRef;
  @ViewChild('canvas')
  canvas!: ElementRef<HTMLCanvasElement>;

  qrResult!: string;
  codeReader = new BrowserMultiFormatReader();
  stream!: MediaStream;
  intervalId!: number;

  ngAfterViewInit(): void {
    this.videoElement.nativeElement.onloadedmetadata = () => {
      // Calculate the aspect ratio of the video
      const videoAspectRatio = this.videoElement.nativeElement.videoWidth / this.videoElement.nativeElement.videoHeight;

      // Set canvas width to video width or max 500px
      const canvasWidth = Math.min(this.videoElement.nativeElement.videoWidth, 500);

      // Calculate canvas height based on the video aspect ratio
      const canvasHeight = canvasWidth / videoAspectRatio;

      // Set canvas dimensions
      this.canvas.nativeElement.width = canvasWidth;
      this.canvas.nativeElement.height = canvasHeight;
    };
  }


  ngOnDestroy(): void {
    this.stopStream();
  }

  async startStream() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      this.videoElement.nativeElement.srcObject = this.stream;

      this.intervalId = window.setInterval(() => {
        this.scanQRFromVideo();
      }, 300);
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  }

  async scanQRFromVideo() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(this.videoElement.nativeElement, 0, 0, canvas.width, canvas.height);

    try {
      const code = this.codeReader.decodeFromCanvas(canvas);
      if (code) {
        this.qrResult = code.getText();
        console.log("QR Code detected:", this.qrResult);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        console.log("QR Code not found in current frame.");
      } else {
        console.error("Error during scanning:", err);
      }
    }
  }

  stopStream() {
    if (this.stream) {
      let tracks = this.stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
