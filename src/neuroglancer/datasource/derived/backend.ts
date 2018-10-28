/**
 * @license
 * Copyright 2018 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {WithParameters} from 'neuroglancer/chunk_manager/backend';
import {DerivedVolumeChunkSourceParameters} from 'neuroglancer/datasource/derived/base';
import {CancellationToken} from 'neuroglancer/util/cancellation';
import {registerSharedObject} from 'neuroglancer/worker_rpc';
import {VolumeChunk, VolumeChunkSource} from 'neuroglancer/sliceview/volume/backend';
import {decodeRawChunk} from 'neuroglancer/sliceview/backend_chunk_decoders/raw';

@registerSharedObject() export class DerivedVolumeChunkSource extends
(WithParameters(VolumeChunkSource, DerivedVolumeChunkSourceParameters)) {
  download(chunk: VolumeChunk, cancellationToken: CancellationToken) {
    this.computeChunkBounds(chunk);
    const chunkDataSize = chunk.chunkDataSize!;
    const chunkSize = chunkDataSize[0] * chunkDataSize[1] * chunkDataSize[2];
    let buffer = new ArrayBuffer(chunkSize);
    let view = new DataView(buffer);
    for (let i = 0; i < chunkSize; ++i) {
      view.setUint8(i, Math.floor(Math.random() * 255));
    }
    decodeRawChunk(chunk, buffer);
    if (cancellationToken.isCanceled) {
      return Promise.reject('Cancelled');
    }
    return Promise.resolve();
  }
}
