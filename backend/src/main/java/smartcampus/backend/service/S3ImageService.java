package smartcampus.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3ImageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        String contentType = file.getContentType();
        if (!"image/jpeg".equals(contentType) && !"image/png".equals(contentType)) {
            throw new IllegalArgumentException("Only JPEG and PNG images are allowed");
        }

        if (file.getSize() > 5L * 1024 * 1024) {
            throw new IllegalArgumentException("Image size must not exceed 5MB");
        }

        String key = "resources/" + UUID.randomUUID() + getExtension(file);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read image file", e);
        }

        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(bytes));

        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + key;
    }

    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        String[] parts = imageUrl.split("\\.amazonaws\\.com/");
        if (parts.length < 2) {
            return;
        }
        String key = parts[1];

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        try {
            s3Client.deleteObject(deleteObjectRequest);
        } catch (Exception e) {
            System.err.println("Failed to delete image from S3 [key=" + key + "]: " + e.getMessage());
        }
    }

    private String getExtension(MultipartFile file) {
        return "image/png".equals(file.getContentType()) ? ".png" : ".jpg";
    }
}
