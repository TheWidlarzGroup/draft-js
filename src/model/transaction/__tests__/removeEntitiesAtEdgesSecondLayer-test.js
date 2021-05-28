/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @flow strict-local
 * @format
 */

'use strict';

import {EntityLayer} from '../../../../types';

const DraftEntityInstance = require('DraftEntityInstance');

const applyEntityToContentBlock = require('applyEntityToContentBlock');
const getSampleStateForTesting = require('getSampleStateForTestingWithEntityAtSecondLayer');
const removeEntitiesAtEdges = require('removeEntitiesAtEdges');

const {
  contentState: sampleContentState,
  selectionState,
} = getSampleStateForTesting();

const selectionOnEntity = selectionState.merge({
  anchorKey: 'b',
  anchorOffset: 2,
  focusKey: 'b',
  focusOffset: 2,
});

// Creates an entity with the given key and mutability
function ensureEntityWithMutability(
  contentState,
  key,
  mutability,
  layer?: EntityLayer,
) {
  return contentState.setEntityMap(
    contentState.getAllEntities().set(
      key,
      new DraftEntityInstance({
        mutability,
        layer: layer || 1,
      }),
    ),
  );
}

const assertRemoveEntitiesAtEdges = (
  selection,
  mutability = 'IMMUTABLE',
  content = sampleContentState,
) => {
  const contentState = ensureEntityWithMutability(content, '2', mutability, 2);
  expect(
    removeEntitiesAtEdges(contentState, selection)
      .getBlockMap()
      .toJS(),
  ).toMatchSnapshot();
};

test('must not affect blockMap if there are no entities - second layer', () => {
  assertRemoveEntitiesAtEdges(selectionState);
});

test('must not remove mutable entities - second layer', () => {
  assertRemoveEntitiesAtEdges(selectionOnEntity, 'MUTABLE');
});

test('must remove immutable entities - second layer', () => {
  assertRemoveEntitiesAtEdges(selectionOnEntity, 'IMMUTABLE');
});

test('must remove segmented entities - second layer', () => {
  assertRemoveEntitiesAtEdges(selectionOnEntity, 'SEGMENTED');
});

test('must not remove if cursor is at start of entity - second layer', () => {
  assertRemoveEntitiesAtEdges(
    selectionOnEntity.merge({
      anchorOffset: 0,
      focusOffset: 0,
    }),
  );
});

test('must remove if cursor is within entity - second layer', () => {
  assertRemoveEntitiesAtEdges(selectionOnEntity);
});

test('must not remove if cursor is at end of entity - second layer', () => {
  const length = sampleContentState.getBlockForKey('b').getLength();
  assertRemoveEntitiesAtEdges(
    selectionOnEntity.merge({
      anchorOffset: length,
      focusOffset: length,
    }),
  );
});

test('must remove for non-collapsed cursor within a single entity - second layer', () => {
  assertRemoveEntitiesAtEdges(selectionOnEntity.set('anchorOffset', 1));
});

test('must remove for non-collapsed cursor on multiple entities - second layer', () => {
  const block = sampleContentState.getBlockForKey('b');
  const newBlock = applyEntityToContentBlock(block, 3, 5, '456');
  const newBlockMap = sampleContentState.getBlockMap().set('b', newBlock);
  let newContent = sampleContentState.setBlockMap(newBlockMap);
  newContent = ensureEntityWithMutability(newContent, '456', 'IMMUTABLE');

  assertRemoveEntitiesAtEdges(
    selectionOnEntity.merge({
      anchorOffset: 1,
      focusOffset: 4,
    }),
    'IMMUTABLE',
    newContent,
  );
});

test('must ignore an entity that is entirely within the selection - second layer', () => {
  const block = sampleContentState.getBlockForKey('b');

  // Remove entity from beginning and end of block.
  let newBlock = applyEntityToContentBlock(block, 0, 1, null);
  newBlock = applyEntityToContentBlock(newBlock, 4, 5, null);

  const newBlockMap = sampleContentState.getBlockMap().set('b', newBlock);
  const newContent = sampleContentState.setBlockMap(newBlockMap);

  assertRemoveEntitiesAtEdges(
    selectionOnEntity.merge({
      anchorOffset: 0,
      focusOffset: 5,
    }),
    'IMMUTABLE',
    newContent,
  );
});

test('must remove entity at start of selection - second layer', () => {
  assertRemoveEntitiesAtEdges(
    selectionState.merge({
      anchorKey: 'b',
      anchorOffset: 3,
      focusKey: 'c',
      focusOffset: 3,
    }),
  );
});

test('must remove entity at end of selection - second layer', () => {
  assertRemoveEntitiesAtEdges(
    selectionState.merge({
      anchorKey: 'a',
      anchorOffset: 3,
      focusKey: 'b',
      focusOffset: 3,
    }),
  );
});

test('must remove entities at both ends of selection - second layer', () => {
  const cBlock = sampleContentState.getBlockForKey('c');
  const len = cBlock.getLength();
  const modifiedC = applyEntityToContentBlock(cBlock, 0, len, '456');
  const newBlockMap = sampleContentState.getBlockMap().set('c', modifiedC);
  let newContent = sampleContentState.setBlockMap(newBlockMap);
  newContent = ensureEntityWithMutability(newContent, '456', 'IMMUTABLE');

  assertRemoveEntitiesAtEdges(
    selectionState.merge({
      anchorKey: 'b',
      anchorOffset: 3,
      focusKey: 'c',
      focusOffset: 3,
    }),
    'IMMUTABLE',
    newContent,
  );
});
