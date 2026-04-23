package smartcampus.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3Service {

    @Value("${aws.s3.tickets.access-key}")
    private String accessKey;

    @Value("${aws.s3.tickets.secret-key}")
    private String secretKey;

    @Value("${aws.s3.tickets.region}")
    private String region;

    @Value("${aws.s3.tickets.bucket}")
    private String bucket;

    /**
     * Uploads a file to a specific ticket folder in S3.
     * Builds its own S3Client to avoid conflicts with other modules.
     */
    public String uploadFile(MultipartFile file, String ticketId) throws IOException {
        String key = "tickets/" + ticketId + "/" + UUID.randomUUID() + "-" + file.getOriginalFilename();

        // Build client directly inside the method
        try (S3Client client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .build()) {

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            client.putObject(putRequest, RequestBody.fromBytes(file.getBytes()));

            return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
        } catch (Exception e) {
            // Logs to your VS Code terminal to help debug that 500 error
            System.err.println("CRITICAL: S3 Upload failed for Ticket ID " + ticketId + ". Error: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Deletes a file from S3 using the provided URL.
     * Builds its own S3Client to ensure the correct credentials are used.
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        // Extract key from the S3 URL
        String[] parts = fileUrl.split("\\.amazonaws\\.com/");
        if (parts.length < 2) {
            return;
        }
        String key = parts[1];

        // Build client directly inside the method
        try (S3Client client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .build()) {

            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            client.deleteObject(deleteRequest);
        } catch (Exception e) {
            System.err.println("CRITICAL: S3 Delete failed for URL: " + fileUrl + ". Error: " + e.getMessage());
        }
    }
}