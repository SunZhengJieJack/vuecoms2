import { expect } from 'chai'
import List from '../src/components/utils/list'
let alist = [
  {id: 1, title: 'A'},
  {id: 2, title: 'B'},
]
let treelist = [
  {id: '1', title: 'A', parent: '0'},
  {parent: '1', id: '10', title: 'A-1'},
  {parent: '10', title: 'A-1-1', id: '100'},
  {parent: '20', title: 'B-1-1', id: '200'},
  {id: '2', title: 'B', parent: '0'},
  {parent: '2', id: '20', title: 'B-1'},
]

let treelist1 = [
  {parent: '10', title: 'A-1-1', id: '100'},
  {id: '1', title: 'A', parent: '0'},
  {parent: '1', id: '10', title: 'A-1'},
]

describe('list', function () {
  it('Test get', function() {
    let c = List.get(alist, 1)
    expect(c).to.eql({id:1, title: 'A'})
  })
  it('Test tree', function() {
    let tree = List.tree(treelist, {parent: 'parent', children: 'children', rootvalue: '0'})
    expect(tree).to.eql([
      {id:'1', title: 'A', parent: '0', children: [
        {parent: '1', id: '10', title: 'A-1', children: [{parent: '10', id: '100', title: 'A-1-1'}]},
      ]},
      {id:'2', title: 'B', parent: '0', children: [
        {parent: '2', id: '20', title: 'B-1', children: [{parent: '20', id: '200', title: 'B-1-1'}]},
      ]},
    ]
    )
  })
  it('Test tree1', function() {
    let tree = List.tree(treelist1, {parent: 'parent', children: 'children', rootvalue: '0'})
    expect(tree).to.eql([
      {id:'1', title: 'A', parent: '0', children: [
        {parent: '1', id: '10', title: 'A-1', children: [{parent: '10', id: '100', title: 'A-1-1'}]},
      ]},
    ]
    )
  })
})
