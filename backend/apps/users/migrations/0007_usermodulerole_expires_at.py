from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0006_moduleaccessrequest"),
    ]

    operations = [
        migrations.AddField(
            model_name="usermodulerole",
            name="expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
