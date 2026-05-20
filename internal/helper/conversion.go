package helper

import (
	"errors"
	"fmt"
	"strconv"
)

var ErrIDConversion = errors.New("id conversion error")

func ParseID(input string) (int32, error) {
	if input == "" {
		return 0, fmt.Errorf("%w: id is required", ErrIDConversion)
	}

	id, err := strconv.ParseInt(input, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("%w: %v", ErrIDConversion, err)
	}

	if id <= 0 {
		return 0, fmt.Errorf("%w: id must be positive", ErrIDConversion)
	}

	return int32(id), nil
}
