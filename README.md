# Downmix Renderer Software

**Windows Only**

This software downmixes surround sound and Dolby Atmos content to stereo at resolutions up to a 7.1 speaker configuration. There is no HRTF processing applied. The software works equally well on capable stereo loudspeaker and headphone systems. Parametric equalization, L-R/channel imbalance correction, and upmixing are also available.

This project is mainly inspired by the ideal macOS version built by peqdb: [https://github.com/peqdb/macos.git](https://github.com/peqdb/macos.git)

## Installation And Setup

1. Install and unzip `Downmix Renderer Software.7z` from the Releases section.

2. Install the latest VB-Audio Virtual Cable:

   - Main download page: [https://vb-audio.com/Cable/](https://vb-audio.com/Cable/)
   - Direct download: [http://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack45.zip](http://download.vb-audio.com/Download_CABLE/VBCABLE_Driver_Pack45.zip)

3. Open `Windows Control Panel -> Sound -> Playback`.

   Make sure `CABLE Input` is selected as your default playback device:

   - Right click `CABLE Input`.
   - Select `Set as Default Device`.

   ![Set CABLE Input as the default playback device](images/windows-playback-cable-input-default.png)

   Configure `CABLE Input` speakers to `7.1 Surround`:

   - Right click `CABLE Input`.
   - Select `Configure Speakers`.
   - Select `7.1 Surround`.

   ![Configure CABLE Input speaker setup to 7.1 Surround](images/windows-speaker-setup-7-1.png)

   Set the default format:

   - Right click `CABLE Input`.
   - Select `Properties`.
   - Open the `Advanced` tab.
   - Set `Default Format` to `24 bit, 192000 Hz (Studio Quality)`.
   - Optionally, you can use `48 kHz` as the default format instead.

   ![Set CABLE Input default format to 24 bit 192000 Hz](images/windows-cable-input-default-format.png)

   Turn off spatial sound for `CABLE Input`:

   - Right click `CABLE Input`.
   - Select `Properties`.
   - Open the `Spatial sound` tab.
   - Set spatial sound format to `Off`.

   ![Turn spatial sound off for CABLE Input](images/windows-cable-input-spatial-off.png)

   You can also verify these settings in Windows Settings:

   - Open `Settings -> System -> Sound -> Output`.
   - Select `CABLE Input`.
   - Confirm the format is `24 bit, 192000 Hz (Studio Quality)`.
   - Confirm spatial sound is turned off for `CABLE Input`.

   ![Verify CABLE Input format and spatial sound in Windows Settings](images/windows-settings-cable-input-properties.png)

   ![Verify CABLE Input is the selected Windows output device](images/windows-settings-output-cable-input.png)

4. Open the `Downmix Renderer.exe` file.

5. If Windows shows a warning that it could not verify the app, select `More info` or `More options`, then select `Run anyway`.

6. Inside Downmix Renderer:

   - `Input Device` should be selected as `CABLE Input` by default.
   - Set `Sample Rate` to `Auto`, or set it to the same sample rate selected in step 3.

7. Optionally, adjust the preamp value and the toggles in the advanced menu according to your needs.

