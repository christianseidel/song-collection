package songbook.collections;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/collections")
@CrossOrigin
public class SongCollectionController {

    private final SongCollectionService songCollectionService;

    public SongCollectionController(SongCollectionService songCollectionService) {
        this.songCollectionService = songCollectionService;
    }

    // ONLY TESTING
    @GetMapping
    public ResponseEntity<String> malSehen() {
        return new ResponseEntity<>("Hello!", HttpStatus.BAD_REQUEST);
    }

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadCollection(@RequestParam("file") MultipartFile file) throws IOException {

        // HINT
        System.out.println("\n-> Received file \"" + file.getOriginalFilename()
                + "\" with Content Type: \"" + file.getContentType() + "\"");

        String feedback = songCollectionService.processMultipartFile(file);

        /*
        try {
            System.out.println("bis hier her");
            List<String> s = Files.readAllLines(file);
        } catch (IOException e) {
            System.out.println("Cannot read this file.");
        }

 */
       // System.out.println("s");
        /*
        try {
            Files.copy(file, temporaryDirectory, StandardCopyOption.REPLACE_EXISTING);
        } catch (Exception e) {
            System.out.println("Could not save file!");
        }
*/

/*
            storageService.store(file);
            redirectAttributes.addFlashAttribute("message",
                    "You successfully uploaded " + file.getOriginalFilename() + "!");

            return "redirect:/";
        }
*/

        /*
        try {
            Files.delete(temporaryDirectory);
            System.out.println("Temporary directory deleted.");
        } catch (IOException e) {
            throw new RuntimeException("Unable to delete temporary song collection directory");
        }
*/
        String feedbackJSONfied = "{\"message\": \"" + feedback + "\"}";
        return new ResponseEntity<>(feedbackJSONfied, HttpStatus.CREATED);
        }

}
