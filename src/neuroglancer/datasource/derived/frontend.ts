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
import {ChunkManager, WithParameters} from 'neuroglancer/chunk_manager/frontend';
import {DataSource} from 'neuroglancer/datasource';
import {DataType, VolumeChunkSpecification, VolumeSourceOptions, VolumeType} from 'neuroglancer/sliceview/volume/base';
import {DerivedVolumeChunkSourceParameters} from 'neuroglancer/datasource/derived/base';
import {MultiscaleVolumeChunkSource as GenericMultiscaleVolumeChunkSource, VolumeChunkSource} from 'neuroglancer/sliceview/volume/frontend';
import { vec3, mat4 } from 'gl-matrix';

class DerivedVolumeChunkSource extends
(WithParameters(VolumeChunkSource, DerivedVolumeChunkSourceParameters)) {}

export class DerivedMultiscaleVolumeChunkSource implements GenericMultiscaleVolumeChunkSource {
  numChannels: number;
  dataType: DataType;
  volumeType: VolumeType;

  constructor(public chunkManager: ChunkManager, public config: string) {
    this.numChannels = 1;
    this.dataType = DataType.UINT8;
    this.volumeType = VolumeType.IMAGE;
  }

  getSources(volumeSourceOptions: VolumeSourceOptions) {
    const result = VolumeChunkSpecification
      .getDefaults({
        voxelSize: vec3.fromValues(4, 4, 4),
        dataType: this.dataType,
        numChannels: this.numChannels,
        transform: mat4.fromTranslation(
            mat4.create(),
            vec3.multiply(vec3.create(), vec3.create(), vec3.create())),
        upperVoxelBound: vec3.fromValues(1024, 1024, 1024),
        volumeType: this.volumeType,
        chunkDataSizes: [vec3.fromValues(64, 64, 64)],
        baseVoxelOffset: vec3.create(),
        volumeSourceOptions,
      }).map(spec => this.chunkManager.getChunkSource(
        DerivedVolumeChunkSource, {
          spec,
          parameters: {
            'baseUrls': 'foo',
            'path': 'bar',
            'ecnoding': 'baz'
          }
        }
      ));
    return [result];
  }

  getMeshSource() { return null; }
}


export class DerivedDataSource extends DataSource {
  get description() {
    return 'Precomputed file-backed data source';
  }

  getVolume(chunkManager: ChunkManager, config: string) {
    return new DerivedMultiscaleVolumeChunkSource(chunkManager, config);
  }
}
