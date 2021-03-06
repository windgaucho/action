import shortid from 'shortid';
import getRethink from '../../../../database/rethinkDriver';
import {ACTIVE, FUTURE} from '../../../../../universal/utils/constants';
import {ContentState, convertToRaw} from 'draft-js';

const removeSpaces = (str) => str.split(/\s/).filter((s) => s.length).join(' ');

const convertToRawDraftJSON = (spacedText) => {
  const text = removeSpaces(spacedText);
  const contentState = ContentState.createFromText(text);
  const raw = convertToRaw(contentState);
  return JSON.stringify(raw);
};

const SEED_PROJECTS = [
  {
    status: ACTIVE,
    sortOrder: 0,
    content: convertToRawDraftJSON(`
      Invite any missing team members to join the team. Tap on ‘Team Settings’
      in the dashboard header above.
    `)
  },
  {
    status: ACTIVE,
    sortOrder: 1,
    content: convertToRawDraftJSON(`
      Try a test run of an Action Meeting. Tap on ‘Meeting Lobby’ in
      the dashboard header above.
    `)
  },
  {
    status: FUTURE,
    sortOrder: 0,
    content: convertToRawDraftJSON(`
      Make good teaming a habit! Schedule a weekly Action Meeting with your
      team. Pro-tip: include a link to the meeting lobby.
    `)
  },
  {
    status: FUTURE,
    sortOrder: 1,
    content: convertToRawDraftJSON(`
      Add integrations (like Slack, GitHub…) for your team.
      See the Integrations tab under Team Settings
    `)
  }
];

export default (userId, teamId) => {
  const r = getRethink();
  const now = new Date();

  const seedProjects = SEED_PROJECTS.map((proj) => ({
    ...proj,
    id: `${teamId}::${shortid.generate()}`,
    createdAt: now,
    createdBy: userId,
    tags: [],
    teamId,
    teamMemberId: `${userId}::${teamId}`,
    userId,
    updatedAt: now
  }));

  return r.table('Project').insert(seedProjects, {returnChanges: true})
    .do((result) => {
      return r.table('ProjectHistory').insert(
        result('changes').map((change) => ({
          id: shortid.generate(),
          content: change('new_val')('content'),
          projectId: change('new_val')('id'),
          status: change('new_val')('status'),
          teamMemberId: change('new_val')('teamMemberId'),
          updatedAt: change('new_val')('updatedAt')
        }))
      );
    })
    .run();
};
