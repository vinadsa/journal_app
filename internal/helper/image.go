package helper

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	_ "image/png"

	"golang.org/x/image/draw"
)

// GenerateThumbnail scales down an image to the specified max width and height,
// preserving aspect ratio, and returns a JPEG encoded byte slice.
func GenerateThumbnail(data []byte, maxWidth, maxHeight int) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Only scale down
	if width <= maxWidth && height <= maxHeight {
		// Just re-encode to JPEG for consistency
		return encodeJPEG(img)
	}

	ratio := float64(width) / float64(height)
	newWidth := maxWidth
	newHeight := int(float64(maxWidth) / ratio)

	if newHeight > maxHeight {
		newHeight = maxHeight
		newWidth = int(float64(maxHeight) * ratio)
	}

	dst := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)

	return encodeJPEG(dst)
}

func encodeJPEG(img image.Image) ([]byte, error) {
	buf := new(bytes.Buffer)
	// Quality 80 is a good balance for thumbnails
	err := jpeg.Encode(buf, img, &jpeg.Options{Quality: 80})
	if err != nil {
		return nil, fmt.Errorf("failed to encode jpeg: %w", err)
	}
	return buf.Bytes(), nil
}
