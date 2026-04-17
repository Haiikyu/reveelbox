-- Migration: Add image_url column to shop tables
-- This allows items to use either SVG code or image URLs

-- Add image_url column to shop_pins
ALTER TABLE shop_pins
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to shop_banners
ALTER TABLE shop_banners
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to shop_frames
ALTER TABLE shop_frames
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Make svg_code nullable (optional) since we now have image_url as alternative
ALTER TABLE shop_pins
ALTER COLUMN svg_code DROP NOT NULL;

ALTER TABLE shop_banners
ALTER COLUMN svg_code DROP NOT NULL;

ALTER TABLE shop_frames
ALTER COLUMN svg_code DROP NOT NULL;

-- Add constraint to ensure at least one of svg_code or image_url is provided
ALTER TABLE shop_pins
ADD CONSTRAINT shop_pins_image_check
CHECK (
  (svg_code IS NOT NULL AND svg_code != '') OR
  (image_url IS NOT NULL AND image_url != '')
);

ALTER TABLE shop_banners
ADD CONSTRAINT shop_banners_image_check
CHECK (
  (svg_code IS NOT NULL AND svg_code != '') OR
  (image_url IS NOT NULL AND image_url != '')
);

ALTER TABLE shop_frames
ADD CONSTRAINT shop_frames_image_check
CHECK (
  (svg_code IS NOT NULL AND svg_code != '') OR
  (image_url IS NOT NULL AND image_url != '')
);

-- Add comment
COMMENT ON COLUMN shop_pins.image_url IS 'URL of the image (alternative to svg_code)';
COMMENT ON COLUMN shop_banners.image_url IS 'URL of the image (alternative to svg_code)';
COMMENT ON COLUMN shop_frames.image_url IS 'URL of the image (alternative to svg_code)';
