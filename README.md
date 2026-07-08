# Downmix Renderer Software

**Windows Only**

This software downmixes surround sound and Dolby Atmos content to stereo at resolutions up to a 7.1 speaker configuration. There is no HRTF processing applied. The software works equally well on capable stereo loudspeaker and headphone systems. Parametric equalization, L-R/channel imbalance correction, and upmixing are also available.

This project is mainly inspired by the ideal macOS version built by peqdb: [https://github.com/peqdb/macos.git](https://github.com/peqdb/macos.git)

## Installation And Setup

1. Install and unzip `Downmix Renderer Software.7z` from the Releases section.

2. Install the latest VB-Audio Virtual Cable:

   - Main download page: [https://vb-audio.com/Cable/](https://vb-audio.com/Cable/)
   - Direct download: [http://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack45.zip](http://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack45.zip)

3. Open `Windows Control Panel -> Sound -> Playback`, then follow the screenshots below.

### Set CABLE Input As Default Playback Device

![Set CABLE Input as the default playback device](images/windows-playback-cable-input-default.png)

`Control Panel -> Sound -> Playback -> Right click CABLE Input -> Set as Default Device`

### Configure CABLE Input To 7.1 Surround

![Configure CABLE Input speaker setup to 7.1 Surround](images/windows-speaker-setup-7-1.png)

`Control Panel -> Sound -> Playback -> Right click CABLE Input -> Configure Speakers -> 7.1 Surround`

### Set The Default Format

![Set CABLE Input default format to 24 bit 192000 Hz](images/windows-cable-input-default-format.png)

`Control Panel -> Sound -> Playback -> Right click CABLE Input -> Properties -> Advanced -> Default Format -> 24 bit, 192000 Hz (Studio Quality)`

Optionally, you can use `48 kHz` as the default format instead.

### Turn Off Spatial Sound

![Turn spatial sound off for CABLE Input](images/windows-cable-input-spatial-off.png)

`Control Panel -> Sound -> Playback -> Right click CABLE Input -> Properties -> Spatial sound -> Spatial sound format -> Off`

### Verify CABLE Input In Windows Settings

![Verify CABLE Input format and spatial sound in Windows Settings](images/windows-settings-cable-input-properties.png)

`Settings -> System -> Sound -> Output -> CABLE Input -> Format -> 24 bit, 192000 Hz (Studio Quality) -> Spatial sound -> Off`

![Verify CABLE Input is the selected Windows output device](images/windows-settings-output-cable-input.png)

`Settings -> System -> Sound -> Output -> Choose where to play sound -> CABLE Input`

4. Open the `Downmix Renderer.exe` file.

5. If Windows shows a warning that it could not verify the app, select `More info` or `More options`, then select `Run anyway`.

6. Inside Downmix Renderer:

   - `Input Device` should be selected as `CABLE Input` by default.
   - Set `Sample Rate` to `Auto`, or set it to the same sample rate selected in step 3.

7. Optionally, adjust the preamp value and the toggles in the advanced menu according to your needs.

