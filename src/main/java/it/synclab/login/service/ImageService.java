package it.synclab.login.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.DataFormatException;
import java.util.zip.Deflater;
import java.util.zip.Inflater;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import it.synclab.login.Image;
import it.synclab.login.repository.ImageRepository;

@Service
public class ImageService {
	
	@Autowired
	private ImageRepository imageRepository;
	
	public Image uploadImage(MultipartFile file) throws IOException {
		String fileName = StringUtils.cleanPath(file.getOriginalFilename());
	    Image img = new Image(fileName, file.getContentType(), compressBytes(file.getBytes()));
	    if(imageRepository.findByHashCode(img.getHashCode()).isPresent()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image not valid");
	    return imageRepository.save(img);
	}
	
	public Image getImage(String name) {
		Image retrievedImage = imageRepository.findFirstByName(name).get();
		Image img = new Image(retrievedImage.getName(), retrievedImage.getType(), decompressBytes(retrievedImage.getData()));
	    return img;
	}

	
	// compress the image bytes before storing it in the database
	private static byte[] compressBytes(byte[] data) {
		Deflater deflater = new Deflater();
		deflater.setInput(data);
		deflater.finish();
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length);
		byte[] buffer = new byte[1024];
		while (!deflater.finished()) {
			int count = deflater.deflate(buffer);
			outputStream.write(buffer, 0, count);
		}
		try {
			outputStream.close();
		} catch (IOException e) { }
		return outputStream.toByteArray();
	}

	// uncompress the image bytes before returning it to the angular application
	private static byte[] decompressBytes(byte[] data) {
		Inflater inflater = new Inflater();
		inflater.setInput(data);
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length);
		byte[] buffer = new byte[1024];
		try {
			while (!inflater.finished()) {
				int count = inflater.inflate(buffer);
				outputStream.write(buffer, 0, count);
			}
			outputStream.close();
		} catch (IOException ioe) { }
		catch (DataFormatException e) { }
		return outputStream.toByteArray();
	}
	
	/*
	public Stream<Image> getAllFiles() {
	  return imageRepository.findAll().stream();
	}*/
}
