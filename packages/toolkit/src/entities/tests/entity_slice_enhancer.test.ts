import {
  buildCreateSlice,
  createEntityAdapter,
  createSlice,
  entityMethodsCreator,
} from '@reduxjs/toolkit'
import type {
  PayloadAction,
  SliceCaseReducers,
  ValidateSliceCaseReducers,
} from '../..'
import type { EntityId, EntityState, IdSelector } from '../models'
import { AClockworkOrange, type BookModel } from './fixtures/book'

describe('Entity Slice Enhancer', () => {
  let slice: ReturnType<typeof entitySliceEnhancer<BookModel, string>>

  beforeEach(() => {
    slice = entitySliceEnhancer({
      name: 'book',
      selectId: (book: BookModel) => book.id,
    })
  })

  it('exposes oneAdded', () => {
    const action = slice.actions.oneAdded(AClockworkOrange)
    const oneAdded = slice.reducer(undefined, action)
    expect(oneAdded.entities['0']).toBe(AClockworkOrange)
  })
})

interface EntitySliceArgs<
  T,
  Id extends EntityId,
  CaseReducers extends SliceCaseReducers<EntityState<T, Id>>,
> {
  name: string
  selectId: IdSelector<T, Id>
  modelReducer?: ValidateSliceCaseReducers<EntityState<T, Id>, CaseReducers>
}

function entitySliceEnhancer<
  T,
  Id extends EntityId,
  CaseReducers extends SliceCaseReducers<EntityState<T, Id>> = {},
>({ name, selectId, modelReducer }: EntitySliceArgs<T, Id, CaseReducers>) {
  const modelAdapter = createEntityAdapter({
    selectId,
  })

  return createSlice({
    name,
    initialState: modelAdapter.getInitialState(),
    reducers: {
      oneAdded(state, action: PayloadAction<T>) {
        modelAdapter.addOne(state, action.payload)
      },
      ...modelReducer,
    },
  })
}

describe('entity slice creator', () => {
  const createAppSlice = buildCreateSlice({
    creators: { entityMethods: entityMethodsCreator },
  })

  const bookAdapter = createEntityAdapter<BookModel>()

  const bookSlice = createAppSlice({
    name: 'book',
    initialState: bookAdapter.getInitialState({
      nested: bookAdapter.getInitialState(),
    }),
    reducers: (create) => ({
      ...create.entityMethods(bookAdapter, {
        name: 'book',
      }),
      ...create.entityMethods(bookAdapter, {
        selectEntityState: (state) => state.nested,
        name: 'nestedBook',
        pluralName: 'nestedBookies',
      }),
    }),
  })

  it('should generate correct actions', () => {
    expect(bookSlice.actions.addOneBook).toBeTypeOf('function')
    expect(bookSlice.actions.addOneNestedBook).toBeTypeOf('function')
    expect(bookSlice.actions.addManyBooks).toBeTypeOf('function')
    expect(bookSlice.actions.addManyNestedBookies).toBeTypeOf('function')
  })
  it('should handle actions', () => {
    const withBook = bookSlice.reducer(
      undefined,
      bookSlice.actions.addOneBook(AClockworkOrange),
    )
    expect(
      bookAdapter.getSelectors().selectById(withBook, AClockworkOrange.id),
    ).toBe(AClockworkOrange)

    const withNestedBook = bookSlice.reducer(
      withBook,
      bookSlice.actions.addOneNestedBook(AClockworkOrange),
    )
    expect(
      bookAdapter
        .getSelectors(
          (state: ReturnType<typeof bookSlice.reducer>) => state.nested,
        )
        .selectById(withNestedBook, AClockworkOrange.id),
    ).toBe(AClockworkOrange)
  })
})
