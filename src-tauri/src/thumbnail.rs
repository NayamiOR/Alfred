use image::{ImageBuffer, Rgba};
use pdfium_render::prelude::*;
use std::path::Path;
#[cfg(target_os = "windows")]
use windows::{
    core::*, Win32::Foundation::*, Win32::Graphics::Gdi::*, Win32::System::Com::*,
    Win32::UI::Shell::*,
};

pub fn generate_thumbnail(
    input_path: &Path,
    output_path: &Path,
    max_size: u32,
) -> std::result::Result<(), String> {
    let extension = input_path
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_lowercase();

    match extension.as_str() {
        "pdf" => generate_pdf_thumbnail(input_path, output_path, max_size),
        _ => generate_system_thumbnail(input_path, output_path, max_size),
    }
}

fn generate_pdf_thumbnail(
    input_path: &Path,
    output_path: &Path,
    max_size: u32,
) -> std::result::Result<(), String> {
    // Initialize Pdfium
    let pdfium = Pdfium::new(
        Pdfium::bind_to_library(Pdfium::pdfium_platform_library_name_at_path("./"))
            .or_else(|_| Pdfium::bind_to_system_library())
            .map_err(|e| format!("Failed to bind to Pdfium: {}", e))?,
    );

    let document = pdfium
        .load_pdf_from_file(input_path, None)
        .map_err(|e| format!("Failed to load PDF: {}", e))?;

    let page = document
        .pages()
        .get(0)
        .map_err(|e| format!("Failed to get first page: {}", e))?;

    // Render page to bitmap
    let bitmap = page
        .render_with_config(
            &PdfRenderConfig::new()
                .set_target_width((max_size as u16).into())
                .set_target_height((max_size as u16).into())
                .rotate_if_landscape(PdfPageRenderRotation::None, true),
        )
        .map_err(|e| format!("Failed to render page: {}", e))?;

    // Convert to DynamicImage
    let img = bitmap.as_image(); // returns DynamicImage directly

    // Save directly (it is already resized by render_with_config)
    img.save(output_path)
        .map_err(|e| format!("Failed to save thumbnail: {}", e))
}

#[cfg(target_os = "windows")]
fn generate_system_thumbnail(
    input_path: &Path,
    output_path: &Path,
    max_size: u32,
) -> std::result::Result<(), String> {
    unsafe {
        // Initialize COM library on this thread
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        let path_hstring = HSTRING::from(input_path.as_os_str());

        let shell_item: IShellItem = SHCreateItemFromParsingName(&path_hstring, None)
            .map_err(|e| format!("Failed to create shell item: {}", e))?;

        let image_factory: IShellItemImageFactory = shell_item
            .cast()
            .map_err(|e| format!("Failed to cast to image factory: {}", e))?;

        let size = SIZE {
            cx: max_size as i32,
            cy: max_size as i32,
        };

        let hbitmap = image_factory
            .GetImage(size, SIIGBF_RESIZETOFIT)
            .map_err(|e| format!("Failed to get image: {}", e))?;

        // Convert HBITMAP to Image
        let image = hbitmap_to_image(hbitmap)?;

        // Cleanup HBITMAP
        let _ = DeleteObject(hbitmap);

        // Save
        image
            .save(output_path)
            .map_err(|e| format!("Failed to save image: {}", e))?;

        Ok(())
    }
}

#[cfg(not(target_os = "windows"))]
fn generate_system_thumbnail(
    _input_path: &Path,
    _output_path: &Path,
    _max_size: u32,
) -> std::result::Result<(), String> {
    Err("System thumbnail generation not supported on this OS".to_string())
}

#[cfg(target_os = "windows")]
unsafe fn hbitmap_to_image(hbitmap: HBITMAP) -> std::result::Result<image::DynamicImage, String> {
    let hdc = CreateCompatibleDC(None);
    if hdc.is_invalid() {
        return Err("Failed to create compatible DC".to_string());
    }

    let mut bitmap_info = BITMAP {
        ..Default::default()
    };
    if GetObjectW(
        hbitmap,
        std::mem::size_of::<BITMAP>() as i32,
        Some(&mut bitmap_info as *mut _ as *mut _),
    ) == 0
    {
        let _ = DeleteDC(hdc);
        return Err("Failed to get bitmap info".to_string());
    }

    let width = bitmap_info.bmWidth;
    let height = bitmap_info.bmHeight;
    let abs_height = height.abs();

    let mut bmi = BITMAPINFO {
        bmiHeader: BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: width,
            biHeight: -abs_height, // Top-down
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0, // Use .0 for u32 value
            ..Default::default()
        },
        ..Default::default()
    };

    let mut pixels: Vec<u8> = vec![0; (width * abs_height * 4) as usize];

    if GetDIBits(
        hdc,
        hbitmap,
        0,
        abs_height as u32,
        Some(pixels.as_mut_ptr() as *mut _),
        &mut bmi,
        DIB_RGB_COLORS,
    ) == 0
    {
        let _ = DeleteDC(hdc);
        return Err("Failed to get DIB bits".to_string());
    }

    let _ = DeleteDC(hdc);

    // Pixels are BGRA, convert to RGBA
    for chunk in pixels.chunks_mut(4) {
        let b = chunk[0];
        let r = chunk[2];
        chunk[0] = r;
        chunk[2] = b;
    }

    // Force alpha if needed
    let mut has_alpha = false;
    for chunk in pixels.chunks(4) {
        if chunk[3] != 0 {
            has_alpha = true;
            break;
        }
    }

    if !has_alpha {
        for chunk in pixels.chunks_mut(4) {
            chunk[3] = 255;
        }
    }

    let buffer = ImageBuffer::<Rgba<u8>, _>::from_raw(width as u32, abs_height as u32, pixels)
        .ok_or("Failed to create image buffer")?;

    Ok(image::DynamicImage::ImageRgba8(buffer))
}
