// tests/user.controller.spec.js
const UserController = require('../controllers/user.controller');
const UserService = require('../services/user.service');

jest.mock('../services/user.service');

function mockReq(body = {}, params = {}, query = {}) {
  return { body, params, query };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('UserController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should return 201 with created user', async () => {
      const user = { _id: '1', firstName: 'Foo', email: 'a@b.com' };
      UserService.createUser.mockResolvedValue(user);

      const req = mockReq({ firstName: 'Foo', email: 'a@b.com', password: 'secret' });
      const res = mockRes();

      await UserController.create(req, res);

      expect(UserService.createUser).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: user });
    });

    it('should handle service error', async () => {
      UserService.createUser.mockRejectedValue(new Error('dup'));
      const req = mockReq({ firstName: 'Foo' });
      const res = mockRes();

      await UserController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('getById', () => {
    it('returns user when found', async () => {
      const u = { _id: '1', firstName: 'X' };
      UserService.findById.mockResolvedValue(u);
      const req = mockReq({}, { id: '1' });
      const res = mockRes();

      await UserController.getById(req, res);

      expect(UserService.findById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: u });
    });

    it('returns 404 when not found', async () => {
      UserService.findById.mockResolvedValue(null);
      const req = mockReq({}, { id: 'missing' });
      const res = mockRes();

      await UserController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Utilisateur non trouvé' });
    });
  });

  describe('list', () => {
    it('returns paged list', async () => {
      const payload = { total: 1, page: 1, limit: 25, items: [] };
      UserService.list.mockResolvedValue(payload);

      const req = mockReq({}, {}, { q: 'foo' });
      const res = mockRes();

      await UserController.list(req, res);

      expect(UserService.list).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: payload });
    });
  });

  describe('update', () => {
    it('updates existing user', async () => {
      const updated = { _id: '1', firstName: 'Changed' };
      UserService.updateUser.mockResolvedValue(updated);

      const req = mockReq({ firstName: 'Changed' }, { id: '1' });
      const res = mockRes();

      await UserController.update(req, res);

      expect(UserService.updateUser).toHaveBeenCalledWith('1', { firstName: 'Changed' });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });

    it('returns 400 on service error', async () => {
      UserService.updateUser.mockRejectedValue(new Error('bad'));
      const req = mockReq({}, { id: '1' });
      const res = mockRes();

      await UserController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('remove', () => {
    it('deletes user', async () => {
      const deleted = { _id: '1' };
      UserService.deleteUser.mockResolvedValue(deleted);

      const req = mockReq({}, { id: '1' });
      const res = mockRes();

      await UserController.remove(req, res);

      expect(UserService.deleteUser).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: deleted });
    });

    it('404 when not found', async () => {
      UserService.deleteUser.mockResolvedValue(null);
      const req = mockReq({}, { id: 'no' });
      const res = mockRes();

      await UserController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('isUnique', () => {
    it('returns uniqueness result', async () => {
      const result = { ok: true, conflicts: {} };
      UserService.isUniqueUser.mockResolvedValue(result);

      const req = mockReq({ email: 'a@b.com' });
      const res = mockRes();

      await UserController.isUnique(req, res);

      expect(UserService.isUniqueUser).toHaveBeenCalledWith(req.body, null);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('giveAccess', () => {
    it('gives access', async () => {
      const updated = { _id: '1', username: 'u' };
      UserService.giveAccess.mockResolvedValue(updated);

      const req = mockReq({ username: 'u', password: 'pwd' }, { id: '1' });
      const res = mockRes();

      await UserController.giveAccess(req, res);

      expect(UserService.giveAccess).toHaveBeenCalledWith('1', { username: 'u', password: 'pwd' });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });
  });

  describe('assignDepot / assignVehicle', () => {
    it('assigns depot', async () => {
      const updated = { _id: '1', idDepot: 'd1' };
      UserService.assignDepot.mockResolvedValue(updated);

      const req = mockReq({ depotId: 'd1' }, { id: '1' });
      const res = mockRes();

      await UserController.assignDepot(req, res);

      expect(UserService.assignDepot).toHaveBeenCalledWith('1', 'd1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });

    it('assigns vehicle', async () => {
      const updated = { _id: '1', assignedVehicle: 'v1' };
      UserService.assignVehicle.mockResolvedValue(updated);

      const req = mockReq({ vehicleId: 'v1' }, { id: '1' });
      const res = mockRes();

      await UserController.assignVehicle(req, res);

      expect(UserService.assignVehicle).toHaveBeenCalledWith('1', 'v1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });
  });
});
