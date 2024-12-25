# Authorization

At the beginning, it is necessary to ensure access to the platform for users. 
__User registration in the system is performed exclusively by the platform administrator or `Root Admin`.__


After the user is registered by the `Root Admin`, in order to be able to manage entities within the system, it is necessary to have certain rights.
Mainflux uses **roles** to control permissions for entities at two levels: at the Organization level and at the Group level.

*More information about creating a user can be found at [Users API](api.md#users)*.

---
## Roles
Roles determine the permissions a User has within an Organization or Group.
Below are the predefined roles in the system:

### Viewer
- Can only view entities (read-only access).
- Applies to both Organization and Group levels.

### Editor
- Can create, delete, and view entities within the Organization or Group.

### Admin
- Has all the permissions of an editor.
- Can assign and unassign Members to the Organization or Group.

### Owner
- <u>**This role is only available at the Organization level**</u> !
- Has all the permissions of an admin.
- Has access to all entities within the Organization they own.

### Root Admin
- Has all permissions across all Organizations and Groups (and entities within them).
- Acts as the primary administrator for the entire platform.

For a simpler overview of common roles for Organizations and Groups, the table below provides a clear overview:

| Role       | View Entities | Create/Delete Entities | Assign/Unassign Members | Platform-wide Access |
|------------|---------------|------------------------|-------------------------|----------------------|
| Viewer     | ✅             | ❌                      | ❌                       | ❌                    |
| Editor     | ✅             | ✅                      | ❌                       | ❌                    |
| Admin      | ✅             | ✅                      | ✅                       | ❌                    |
| Root Admin | ✅             | ✅                      | ✅                       | ✅                    |

> Although these roles are the same for an Organization and a Group, **they operate completely separately at those levels**, 
> which means that one User **can have different roles** in an Organization and a Group within that Organization.

## Org Members

When a logged-in User creates an Organization, they become the `Owner` of that Organization.
Within it, they can add other registered users by assigning them appropriate roles defined in the table above.

Unlike an `Admin` of the Organization, an `Owner` has full rights over the entities within their Organization, meaning they can manage entities in Groups without an explicit Group membership.
Depending on the roles users have been assigned, they will be able to view, create, or delete Groups within that Organization.

*An example of assigning Members to an Organization can be found at [Org Members API](api.md#org-members).*

### Examples of unauthorized access

Let's imagine that we have one Organization and four Members of that Organization with different roles:
 
| org_id                               | member_id                            | role   |
  |--------------------------------------|--------------------------------------|--------|
  | 550e8400-e29b-41d4-a716-446655440000 | 3f3f9cc2-1a84-40cd-a7fb-02d9c5e1e5c8 | viewer |
| 550e8400-e29b-41d4-a716-446655440000 | 6b9e77a1-22f8-4e72-b2f3-122ad8b37f48 | editor |
| 550e8400-e29b-41d4-a716-446655440000 | c9b8f7d5-8143-47b4-9d72-f83d3f73834e | admin  |
| 550e8400-e29b-41d4-a716-446655440000 | f1c6e7b3-4b29-496a-810b-bf7397dc3842 | owner  |

- If a `Viewer` tries to create a Group within that Organization, they will receive a message indicating that the creation has failed:

> **{"error": "failed to perform authorization over the entity"}**

- In the second case, if a `Viewer` or `Editor` tries to invite new users to the Organization, they will also get the above error message.
- Next case, if an `Admin` attempts to access entities within that Organization's Groups (of which they are not a Member), access will also be denied with an authorization failure message.
- The same error message will be received if the `Owner`, or any other Organization Member who is not a `Root Admin`, tries to access an Organization in which they are not Members

 **To successfully manage the Organization and its Groups and Members, it is necessary to take care of the roles assigned to users and prevent unauthorized access.**

## Group Members

In order to enable the correct management of the entities within the Group, the rights that the members have over these entities are checked.
Rights over entities are defined based on <u>the role in the Group</u> in which they belong.

As previously emphasized, roles in an Organization and roles in a Group are independent and don't affect each other, which means that if a User is a `Viewer` in an Organization and a Group `Admin` adds them to the Group as an `Editor`, they will have higher rights in the Group than the rights they have in the Organization.

By creating a Group, the User becomes its `Admin` and has the rights defined in the table.

If we keep the data from the previous table and expand it with new data by creating Groups within the Organization and assigning Group roles to the existing members of the Organization, 
the additional table would look like this:

| org_id                               | group_id                             | member_id                            | role   |
|--------------------------------------|--------------------------------------|--------------------------------------|--------|
| 550e8400-e29b-41d4-a716-446655440000 | 9f8e7a61-d34e-4a7a-9836-df8c3f54d3a1 | 3f3f9cc2-1a84-40cd-a7fb-02d9c5e1e5c8 | editor |
| 550e8400-e29b-41d4-a716-446655440000 | 15ee88e2-3632-41fb-acfa-2625645a2b8d | 6b9e77a1-22f8-4e72-b2f3-122ad8b37f48 | viewer |
| 550e8400-e29b-41d4-a716-446655440000 | 565ddcfb-bf64-4e6b-80ac-371516bd0e01 | c9b8f7d5-8143-47b4-9d72-f83d3f73834e | admin  |

We can notice that the User who has the role of `Viewer` in the Organization now has the role of `Editor` in the group with ID `9f8e7a61-d34e-4a7a-9836-df8c3f54d3a1`. 
This means that the User now has all the rights provided by that role.

On the other hand, the User with ID `6b9e77a1-22f8-4e72-b2f3-122ad8b37f48` who is an Organization `Editor` now has the Group's `Viewer` role. 
Therefore, that Member doesn't have any rights in the Group other than viewing the entities.

Since the `Admin` of the Organization is also the `Admin` of the Group with ID `565ddcfb-bf64-4e6b-80ac-371516bd0e01`, it means that they created the Group.

Based on the above examples of unauthorized access within the Organization, the same rules are applied within the Group based on the roles of the Members.

In addition to the basic access rights that apply to Members, note the case of Thing creation.
When creating a Thing, it needs to be assigned a specific Profile by specifying its ID. The Profile being assigned and the Thing <u> must belong to the same Group. </u>

*An example of assigning Members to a Group can be found at [Group Members API](api.md#group-members).*
