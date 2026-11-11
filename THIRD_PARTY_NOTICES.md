# Third-party notices

Downmix Renderer bundles the open-source components below. Each remains under its own licence;
the Downmix Renderer licence (LICENSE) does not apply to them. Licence texts are in the `licenses`
folder, or in the component's `*.dist-info` folder inside `_internal`.

## Qt 6, PySide6 and Shiboken6 (LGPL-3.0)

- Qt 6.12, Copyright (C) The Qt Company Ltd. and other contributors.
- PySide6 and Shiboken6 6.12.0, Copyright (C) The Qt Company Ltd.

Used under the GNU Lesser General Public License version 3 (`licenses/LGPL-3.0.txt`, which builds on
`licenses/GPL-3.0.txt`). They are unmodified and dynamically linked: the Qt and PySide6 libraries are
the separate `Qt6*.dll` files and the `PySide6` and `shiboken6` folders inside `_internal`, and you
may replace them with your own compatible builds. Their source code is available from
https://download.qt.io/official_releases/QtForPython/ and https://code.qt.io/.

## Python (PSF License)

Python 3.13, Copyright (c) 2001 Python Software Foundation. All rights reserved.
Licensed under the Python Software Foundation License Version 2: https://docs.python.org/3/license.html

## PyInstaller bootloader (GPL-2.0 with the bootloader exception)

The application launcher is built with PyInstaller. Its bootloader is licensed under the GPL-2.0 with
an exception that allows it to be used in programs under any licence:
https://github.com/pyinstaller/pyinstaller/blob/develop/COPYING.txt

## NumPy (BSD-3-Clause)

Copyright (c) 2005-2024, NumPy Developers. All rights reserved. The Windows build of NumPy bundles
OpenBLAS and other libraries; their notices are in `numpy-2.2.6.dist-info` inside `_internal`.

## python-sounddevice (MIT) and PortAudio (MIT)

- python-sounddevice, Copyright (c) 2015-2025 Matthias Geier.
- PortAudio, Copyright (c) 1999-2011 Ross Bencina and Phil Burk.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions: The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
WITHOUT WARRANTY OF ANY KIND.

## CFFI (MIT) and pycparser (BSD-3-Clause)

- CFFI, Copyright (c) the CFFI contributors.
- pycparser, Copyright (c) 2008-2027, Eli Bendersky.

Full texts are in their `*.dist-info` folders inside `_internal`.

## pywin32 (PSF License)

Copyright (c) Mark Hammond and contributors. https://github.com/mhammond/pywin32

## miniaudio (public domain, or MIT No Attribution)

Copyright 2026 David Reid. Used in the native audio engine under the MIT No Attribution licence.
